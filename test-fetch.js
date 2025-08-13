const fs = require('fs');

async function testFetch() {
  try {
    console.log('Testing fetch...');
    
    // Test with a simple fetch first
    const response = await fetch('https://echo.pims.cfl.ca/api/stats/teams/pims/20');
    console.log('Response status:', response.status);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('Data received:', JSON.stringify(data, null, 2));
    
    // Test creating files
    if (!fs.existsSync('public')) {
      fs.mkdirSync('public');
      console.log('Created public directory');
    }
    
    fs.writeFileSync('public/test.json', JSON.stringify({test: 'success'}, null, 2));
    console.log('Test file written successfully');
    
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

testFetch(); 