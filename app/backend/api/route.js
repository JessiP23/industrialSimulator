const Groq = require('groq-sdk');
const { NextResponse } = require('next/server');

// Initialize Groq with API key
const groq = new Groq({
    apiKey: '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' // Note: Using server-side env variable, not NEXT_PUBLIC
});

export async function POST(req) {
    try {
        // Parse the incoming request body
        const { process, parameters, results } = await req.json();

        // Construct a detailed prompt for the analysis
        const prompt = `Analyze the ${process} process with the following parameters: ${JSON.stringify(parameters)} and results: ${JSON.stringify(results)}. 
        
        Please provide a comprehensive analysis including:
        1. A detailed explanation of the ${process} process and its fundamental principles
        2. Analysis of the current parameters (${Object.keys(parameters).join(', ')}) and their effects on the process
        3. Evaluation of the results: ${Object.keys(results).join(', ')}
        4. Potential edge cases and their implications for this configuration
        5. Three additional use cases for this process with different parameter configurations
        6. Optimization recommendations based on the current results
        
        Format the response with clear sections and bullet points where appropriate.`;

        // Call Groq API with streaming disabled for simplicity
        const completion = await groq.chat.completions.create({
            messages: [{ 
                role: 'user', 
                content: prompt 
            }],
            model: 'llama3-8b-8192',
            temperature: 0.7,
            max_tokens: 2048,
            top_p: 1,
            stream: false,
            stop: null
        });

        // Check if we have a valid response
        if (!completion.choices || !completion.choices[0]) {
            throw new Error('Invalid response from Groq API');
        }

        // Return the analysis
        return NextResponse.json({ 
            content: completion.choices[0].message.content,
            status: 'success'
        });

    } catch (error) {
        console.error('Analysis generation error:', error);
        
        // Return a proper error response
        return NextResponse.json({ 
            error: 'Failed to generate analysis',
            details: error.message,
            status: 'error'
        }, { 
            status: 500 
        });
    }
}
