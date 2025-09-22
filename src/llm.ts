import 'dotenv/config';
// import OpenAI from 'openai';

// const openrouter = new OpenAI({
//     baseURL: "https://openrouter.ai/api/v1",
//     apiKey: process.env.OPENROUTER_API_KEY,
// });

import Cerebras from '@cerebras/cerebras_cloud_sdk';

const cerebras = new Cerebras();

export async function answer(query: string) {
    if (query.length < 500000) {
        try {
            const result = await cerebras.chat.completions.create({
                model: "gpt-oss-120b", //"openai/gpt-oss-120b",
                reasoning_effort: "low",
                messages: [
                    {
                        role: "system",
                        content: "Answer the user in exactly ONE sentence unless asked for a different length explicitly."
                    },
                    {
                        role: "user",
                        content: query
                    }
                ]
            }) as { choices: { message: { content: string } }[] };
            return result.choices[0]?.message.content;
        } catch (err: unknown) {
            if (err instanceof Error) {
                return err.message;
            }
            return String(err);
        }
    }
}