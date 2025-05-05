// Global variables
let model;

// Load the pre-trained MobileNet model
async function loadModel() {
  try {
    // Load MobileNet with a reduced input size for faster inference
    model = await mobilenet.load({
      version: 2,
      alpha: 1.0
    });
    console.log('MobileNet loaded successfully');
    return true;
  } catch (error) {
    console.error('Failed to load model:', error);
    return false;
  }
}

// Process the image and make a prediction
async function classifyImage(imgElement) {
  try {
    // Use MobileNet to classify the image
    const predictions = await model.classify(imgElement, 5);
    
    // Keywords that might indicate Sharia-compliance or non-compliance
    const modestKeywords = ['hijab', 'abaya', 'modest', 'covered', 'loose'];
    const nonModestKeywords = ['swimwear', 'bikini', 'revealing', 'tight', 'short'];
    
    // Calculate a simple compliance score based on detected objects
    let complianceScore = 0;
    let detectedClasses = [];
    
    predictions.forEach(prediction => {
      detectedClasses.push(`${prediction.className} (${(prediction.probability * 100).toFixed(1)}%)`);
      
      // Check for modest keywords
      modestKeywords.forEach(keyword => {
        if (prediction.className.toLowerCase().includes(keyword)) {
          complianceScore += prediction.probability;
        }
      });
      
      // Check for non-modest keywords
      nonModestKeywords.forEach(keyword => {
        if (prediction.className.toLowerCase().includes(keyword)) {
          complianceScore -= prediction.probability;
        }
      });
    });
    
    // Determine classification based on score
    const isCompliant = complianceScore >= 0;
    
    return {
      class: isCompliant ? "Sharia-compliant" : "Not Sharia-compliant",
      confidence: Math.min(Math.abs(complianceScore) * 100, 100).toFixed(2),
      details: detectedClasses
    };
  } catch (error) {
    console.error('Error during classification:', error);
    return null;
  }
}

// Handle the image upload and prediction
document.addEventListener('DOMContentLoaded', async () => {
  const imageUpload = document.getElementById('imageUpload');
  const predictBtn = document.getElementById('predictBtn');
  const imagePreview = document.getElementById('imagePreview');
  const predictionDiv = document.getElementById('prediction');
  const loadingDiv = document.getElementById('loading');
  
  // Load the model when the page loads
  const modelLoaded = await loadModel();
  if (!modelLoaded) {
    alert('Failed to load the model. Please refresh the page and try again.');
  }
  
  // Handle file selection
  imageUpload.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        // Create image element
        imagePreview.innerHTML = '';
        const img = document.createElement('img');
        img.src = e.target.result;
        img.id = 'uploadedImage';
        imagePreview.appendChild(img);
      };
      reader.readAsDataURL(file);
    }
  });
  
  // Handle prediction button click
  predictBtn.addEventListener('click', async () => {
    const img = document.getElementById('uploadedImage');
    if (!img) {
      alert('Please upload an image first');
      return;
    }
    
    // Show loading indicator
    loadingDiv.classList.remove('hidden');
    predictionDiv.innerHTML = '';
    
    // Wait for the image to load completely
    if (!img.complete) {
      await new Promise(resolve => {
        img.onload = resolve;
      });
    }
    
    // Make prediction
    const result = await classifyImage(img);
    
    // Hide loading indicator
    loadingDiv.classList.add('hidden');
    
    // Display result
    if (result) {
      predictionDiv.innerHTML = `
        <p>Prediction: <strong>${result.class}</strong> (${result.confidence}% confidence)</p>
        <p>Detected items:</p>
        <ul>${result.details.map(item => `<li>${item}</li>`).join('')}</ul>
      `;
    } else {
      predictionDiv.textContent = 'Error making prediction';
    }
  });
});

