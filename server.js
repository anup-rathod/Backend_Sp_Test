const express = require('express');
const cors = require('cors'); // Import cors
const { AzureOpenAI } = require('openai');

const app = express();
const port = process.env.PORT || 5000;

app.use(cors()); // Use cors middleware to allow all origins
app.use(express.json());

// Azure OpenAI initialization
const apiKey = process.env.AZURE_OPENAI_API_KEY || "1fac5591063f45efab2df26dac051a34"; 
const endpoint = process.env.AZURE_OPENAI_ENDPOINT || "https://chatbotfordemosales.openai.azure.com/";
const deployment = "chatbotdemoforsales";
const apiVersion = "2024-04-01-preview";

const client = new AzureOpenAI({
  endpoint: endpoint,
  apiKey: apiKey,
  deployment: deployment,
  apiVersion: apiVersion,
});

let sharepointData = ''; 
// Endpoint to handle SharePoint data and store it
app.post('/api/send-data', (req, res) => {
  const { listData } = req.body;

  try {
    // Convert SharePoint list data into a string for OpenAI prompt
    sharepointData = listData.map(item => `DeviceID: ${item.DeviceID}, DeviceNames: ${item.DeviceNames}, AssignedUser: ${item.AssignedUser}, Price: ${item.Price}`).join('\n');

    // console.log('Received SharePoint Data:', sharepointData);
    res.status(200).json({ message: 'SharePoint data received successfully' });
  } catch (error) {
    console.error('Error receiving SharePoint data:', error.message);
    res.status(500).json({ error: 'Failed to receive SharePoint data' });
  }
});


// Endpoint to handle prompt processing
app.post('/api/send-prompt', async (req, res) => {
  const { prompt } = req.body;

  try {
    // Process file content
    const fileContent = sharepointData;

    const result = await client.chat.completions.create({
      messages:[
        {"role": "system", "content": `You are a chatbot with knowledge about Inventory List. You have been given a text of inventory list to analyze and provide information on. Users will ask you question about the Inventory details or Device details, and you are expected to answer or summary or user related format them accurately based on the information. If the requested information is not in the provided content, respond with: "The file does not contain information about the given prompt." ${fileContent}`},
        {"role": "user", "content": `${prompt}`},
    ],
      model: 'chatbotdemoforsales',
    });

    const response = result.choices[0].message.content;
    console.log(response)
    res.json({ response });
  } catch (error) {
    console.error('Error processing prompt:', error.message);
    res.status(500).json({ error: 'Failed to process prompt' });
  }
});

// Start server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
