document.addEventListener('DOMContentLoaded', function() {
    const analyzeBtn = document.getElementById('analyzeBtn');
    const reviewDisplay = document.getElementById('reviewDisplay');
    const sentimentResult = document.getElementById('sentimentResult');
    const statusDiv = document.getElementById('status');
    const errorDiv = document.getElementById('error');
    
    let reviews = [];
    
    // Load and parse the TSV file
    statusDiv.textContent = 'Loading reviews...';
    fetch('reviews_test.tsv')
        .then(response => response.text())
        .then(data => {
            const parsed = Papa.parse(data, {
                header: true,
                delimiter: '\t',
                skipEmptyLines: true
            });
            
            reviews = parsed.data.map(row => row.text).filter(text => text && text.trim() !== '');
            statusDiv.textContent = `Loaded ${reviews.length} reviews. Click the button to analyze a random review.`;
            analyzeBtn.disabled = false;
        })
        .catch(error => {
            errorDiv.textContent = `Error loading reviews: ${error.message}`;
            statusDiv.textContent = '';
        });
    
    analyzeBtn.addEventListener('click', function() {
        errorDiv.textContent = '';
        sentimentResult.innerHTML = '';
        
        if (reviews.length === 0) {
            errorDiv.textContent = 'No reviews available for analysis.';
            return;
        }
        
        // Select a random review
        const randomIndex = Math.floor(Math.random() * reviews.length);
        const randomReview = reviews[randomIndex];
        
        // Display the review
        reviewDisplay.textContent = randomReview;
        statusDiv.textContent = 'Analyzing sentiment...';
        analyzeBtn.disabled = true;
        
        // Prepare API request
        const apiToken = document.getElementById('apiToken').value.trim();
        const headers = {
            'Content-Type': 'application/json'
        };
        
        if (apiToken) {
            headers['Authorization'] = `Bearer ${apiToken}`;
        }
        
        // Call Hugging Face API
        fetch('https://api-inference.huggingface.co/models/siebert/sentiment-roberta-large-english', {
            method: 'POST',
            headers: headers,
            body: JSON.stringify({ inputs: randomReview })
        })
        .then(response => {
            if (!response.ok) {
                throw new Error(`API error: ${response.status} ${response.statusText}`);
            }
            return response.json();
        })
        .then(data => {
            // Process the response
            if (Array.isArray(data) && data.length > 0 && Array.isArray(data[0]) && data[0].length > 0) {
                const result = data[0][0];
                
                let sentimentIcon;
                if (result.label === 'POSITIVE' && result.score > 0.5) {
                    sentimentIcon = '<i class="fas fa-thumbs-up" style="color: green;"></i>';
                } else if (result.label === 'NEGATIVE' && result.score > 0.5) {
                    sentimentIcon = '<i class="fas fa-thumbs-down" style="color: red;"></i>';
                } else {
                    sentimentIcon = '<i class="fas fa-question-circle" style="color: gray;"></i>';
                }
                
                sentimentResult.innerHTML = `${sentimentIcon} ${result.label} (${(result.score * 100).toFixed(1)}%)`;
                statusDiv.textContent = 'Analysis complete.';
            } else {
                throw new Error('Unexpected API response format');
            }
        })
        .catch(error => {
            errorDiv.textContent = `Error analyzing sentiment: ${error.message}`;
            statusDiv.textContent = '';
        })
        .finally(() => {
            analyzeBtn.disabled = false;
        });
    });
});