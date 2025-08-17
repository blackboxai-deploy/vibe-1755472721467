// Test what the frontend is actually sending
async function testFrontendRequest() {
  console.log('Testing frontend request...');
  
  // Step 1: Test URL fetching
  const fetchResponse = await fetch("http://localhost:3000/api/fetch-url", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url: "https://example.com" })
  });

  console.log('Fetch response status:', fetchResponse.status);
  const fetchData = await fetchResponse.json();
  console.log('Fetch data keys:', Object.keys(fetchData));
  
  if (!fetchData.success) {
    console.error('Fetch failed:', fetchData.error);
    return;
  }

  const websiteData = fetchData.data;
  const originalContent = websiteData.html + (websiteData.css ? `\n<style>${websiteData.css}</style>` : '');

  console.log('Original content length:', originalContent.length);
  console.log('Original content preview:', originalContent.substring(0, 200));

  // Step 2: Test enhancement
  const enhancePayload = { 
    originalContent: originalContent,
    url: "https://example.com"
  };
  
  console.log('Enhancement payload keys:', Object.keys(enhancePayload));
  console.log('Enhancement payload:', JSON.stringify(enhancePayload, null, 2).substring(0, 500));

  const enhanceResponse = await fetch("http://localhost:3000/api/enhance-website-simple", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(enhancePayload)
  });

  console.log('Enhance response status:', enhanceResponse.status);
  const enhanceResult = await enhanceResponse.text();
  console.log('Enhance response:', enhanceResult.substring(0, 500));
}

testFrontendRequest().catch(console.error);