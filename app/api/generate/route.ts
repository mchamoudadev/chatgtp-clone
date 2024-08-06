import { NextRequest, NextResponse } from 'next/server';
import {OpenAI} from 'openai';


const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

export const runtime = "edge";


export async function POST(req: NextRequest) {


       const {prompt,type} = await req.json(); 

       if(type === "image"){

        const response = await openai.images.generate({
            model: "dall-e-3",
            prompt: prompt,
            n: 1,
            size: "1024x1024"
        });

        return new Response(JSON.stringify({url : response.data[0].url }) ,  {
            headers : {
                'Content-Type': 'application/json'
            }
        })

        // return NextResponse.json(response, {status: 200});
       }else{


        const response = await openai.chat.completions.create({
            model:"gpt-4",
            messages: [
                {
                    role: "assistant",
                    content:"You are a helpful assintance"
                },
                {
                    role: "user",
                    content:prompt
                }
            ],
            stream: true
        });



        const stream = new ReadableStream({

            async start(controller) {

                for await (const chunk of response){
                    
                    const content = chunk.choices[0].delta.content;

                    if(content){
                        controller.enqueue(content);
                    }

                }
                controller.close();
            }
        })

        return new Response(stream, {
            headers :{
                'Content-Type': 'application/json',
                "Cache-Control": "no-cache"
            }
        })
    }
}