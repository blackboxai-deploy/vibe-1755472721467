import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const requestBody = await request.json();
    console.log('Enhancement API received:', Object.keys(requestBody));
    console.log('Request body:', JSON.stringify(requestBody, null, 2));

    const { originalContent, url } = requestBody;

    if (!originalContent) {
      console.log('Missing originalContent. Received keys:', Object.keys(requestBody));
      return NextResponse.json({ error: 'Original content is required' }, { status: 400 });
    }

    console.log('Original content length:', originalContent.length);
    console.log('Original content preview:', originalContent.substring(0, 200));

    const aiResponse = await fetch('https://oi-server.onrender.com/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer xxx',
        'CustomerId': 'cus_SGPn4uhjPI0F4w',
      },
      body: JSON.stringify({
        model: 'openrouter/anthropic/claude-sonnet-4',
        messages: [
          {
            role: 'user',
            content: `Please enhance this HTML content by adding modern CSS styling. Return only the complete HTML file with embedded CSS:\n\n${originalContent}`
          }
        ],
        max_tokens: 3000,
        temperature: 0.7,
      }),
    });

    if (!aiResponse.ok) {
      return NextResponse.json({ error: 'AI API failed' }, { status: 500 });
    }

    const aiData = await aiResponse.json();
    const enhancedContent = aiData.choices[0].message.content;

    // Extract HTML from markdown if needed
    let cleanContent = enhancedContent;
    const htmlMatch = enhancedContent.match(/```html\n([\s\S]*?)\n```/);
    if (htmlMatch) {
      cleanContent = htmlMatch[1];
    }

    return NextResponse.json({
      enhancedContent: cleanContent.trim(),
      originalUrl: url,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}