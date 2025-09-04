import { stringWidth } from 'bun';
import 'dotenv/config';
import OpenAI from 'openai';

const groqai = new OpenAI({
    baseURL: "https://openrouter.ai/api/v1",
    apiKey: process.env.OPENROUTER_API_KEY,
});

export async function answer(query: string) {
    if (query.length < 8000) {
        try {
            return (await groqai.chat.completions.create({
                model: "openai/gpt-oss-120b",
                reasoning_effort: "low",
                messages: [
                    {
                        role: "developer",
                        content: "Follow the user's request with brevity."
                    },
                    {
                        role: "user",
                        content: query
                    }
                ]
            })).choices[0]?.message.content
        } catch (err: unknown) {
            return(JSON.stringify(err))
        }
    }
}