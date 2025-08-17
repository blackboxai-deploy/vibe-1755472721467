interface AIResponse {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
}

interface AIRequestBody {
  model: string;
  messages: Array<{
    role: 'system' | 'user' | 'assistant';
    content: string;
  }>;
  max_tokens?: number;
  temperature?: number;
}

export class AIClient {
  private baseURL = 'https://oi-server.onrender.com/chat/completions';
  private customerId = 'cus_SGPn4uhjPI0F4w';
  private apiKey = 'xxx';

  async enhanceWebsite(
    originalContent: string,
    systemPrompt?: string
  ): Promise<string> {
    const defaultSystemPrompt = `You are an expert web developer and designer. Your task is to analyze the provided website content and create an enhanced, modern version.

Guidelines for enhancement:
1. Modernize the design with contemporary UI/UX principles
2. Improve responsiveness for all device sizes
3. Enhance accessibility (ARIA labels, semantic HTML, keyboard navigation)
4. Optimize performance (efficient CSS, minimal DOM)
5. Add smooth animations and transitions
6. Improve typography and color schemes
7. Ensure cross-browser compatibility
8. Add interactive elements where appropriate
9. Maintain the original content and functionality
10. Use modern CSS features (Grid, Flexbox, CSS Variables)

Return ONLY a complete HTML file with embedded CSS. The output should be a single, self-contained HTML file that can be saved and opened in any browser.

Structure your response as:
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Enhanced Website</title>
    <style>
        /* Your enhanced CSS here */
    </style>
</head>
<body>
    <!-- Your enhanced HTML here -->
</body>
</html>`;

    const requestBody: AIRequestBody = {
      model: 'anthropic/claude-3.5-sonnet',
      messages: [
        {
          role: 'system',
          content: systemPrompt || defaultSystemPrompt
        },
        {
          role: 'user',
          content: `Please enhance this website content:\n\n${originalContent}`
        }
      ],
      max_tokens: 8000,
      temperature: 0.7
    };

    try {
      const response = await fetch(this.baseURL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
          'CustomerId': this.customerId
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        throw new Error(`AI API request failed: ${response.status} ${response.statusText}`);
      }

      const data: AIResponse = await response.json();
      
      if (!data.choices || data.choices.length === 0) {
        throw new Error('No response from AI model');
      }

      return data.choices[0].message.content;
    } catch (error) {
      console.error('AI enhancement error:', error);
      throw new Error(`Failed to enhance website: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async analyzeWebsite(content: string): Promise<{
    summary: string;
    improvements: string[];
    technologies: string[];
  }> {
    const systemPrompt = `You are a web development analyst. Analyze the provided website content and return a JSON object with:
1. summary: A brief description of the website
2. improvements: An array of specific improvement suggestions
3. technologies: An array of technologies/frameworks detected

Return ONLY valid JSON, no other text.`;

    const requestBody: AIRequestBody = {
      model: 'anthropic/claude-3.5-sonnet',
      messages: [
        {
          role: 'system',
          content: systemPrompt
        },
        {
          role: 'user',
          content: `Analyze this website content:\n\n${content}`
        }
      ],
      max_tokens: 1000,
      temperature: 0.3
    };

    try {
      const response = await fetch(this.baseURL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
          'CustomerId': this.customerId
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        throw new Error(`AI API request failed: ${response.status}`);
      }

      const data: AIResponse = await response.json();
      const content = data.choices[0].message.content;
      
      return JSON.parse(content);
    } catch (error) {
      console.error('AI analysis error:', error);
      return {
        summary: 'Unable to analyze website',
        improvements: ['Analysis failed'],
        technologies: ['Unknown']
      };
    }
  }
}

export const aiClient = new AIClient();