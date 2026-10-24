import express from 'express';
import cors from 'cors';
import * as dotenv from 'dotenv';
import {GoogleGenAI} from '@google/genai';

dotenv.config({quiet: true});
const port = process.env.PORT || 8080;

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

const app = express();
app.use(cors());
app.use(express.json());

app.get('/', async (req, res) => {
  res.status(200).send({
    message: 'hello from cody',
  });
});

app.post('/', async (req, res) => {
  try {
    const prompt = req.body.prompt;
    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: `${prompt}`,
      config: {
        temperature: 0,
        maxOutputTokens: 3000,
      },
    });
    res.status(200).send({
      bot: response.text,
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({error});
  }
});

app.listen(port, () => {
  console.log(`server is running on port http://localhost:${port}`);
});
