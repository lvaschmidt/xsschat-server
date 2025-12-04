import 'dotenv/config';
import OpenAI from 'openai';

// import Cerebras from '@cerebras/cerebras_cloud_sdk';
// const cerebras = new Cerebras();

// const openrouter = new OpenAI({
//     baseURL: "https://openrouter.ai/api/v1",
//     apiKey: process.env.OPENROUTER_API_KEY,
// });

const nova = new OpenAI({
    apiKey: process.env.NOVA_API_KEY,
    baseURL: 'https://api.nova.amazon.com/v1',
});

export async function answer(query: string) {
    if (query.length < 500000) {
        try {
            const result = await nova.chat.completions.create({
                model: "nova-2-lite-v1",//"gpt-oss-120b", //"openai/gpt-oss-120b",
                reasoning_effort: "low",
                messages: [
                    {
                        role: "system",
                        content: "Answer the user with brevity, or however best meets the user's request."
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