import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { htmlContent, cssContent, title = 'Enhanced Website' } = await request.json();

    if (!htmlContent) {
      return NextResponse.json(
        { error: 'HTML content is required' },
        { status: 400 }
      );
    }

    // Create a complete HTML file with embedded CSS
    const completeHtml = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <style>
        ${cssContent || ''}
    </style>
</head>
<body>
    ${htmlContent}
</body>
</html>`;

    // Create a blob URL for download
    const buffer = Buffer.from(completeHtml, 'utf-8');
    const base64Content = buffer.toString('base64');

    return NextResponse.json({
      success: true,
      fileContent: completeHtml,
      downloadData: {
        content: base64Content,
        filename: `enhanced-website-${Date.now()}.html`,
        mimeType: 'text/html'
      },
      size: buffer.length
    });

  } catch (error) {
    console.error('Error generating file:', error);
    return NextResponse.json(
      { error: 'Failed to generate file' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const content = searchParams.get('content');
  const filename = searchParams.get('filename') || 'enhanced-website.html';

  if (!content) {
    return NextResponse.json(
      { error: 'Content parameter is required' },
      { status: 400 }
    );
  }

  try {
    const decodedContent = Buffer.from(content, 'base64').toString('utf-8');
    
    return new NextResponse(decodedContent, {
      headers: {
        'Content-Type': 'text/html',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-cache'
      }
    });

  } catch (error) {
    console.error('Error serving file:', error);
    return NextResponse.json(
      { error: 'Failed to serve file' },
      { status: 500 }
    );
  }
}