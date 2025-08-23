import React, { useState } from 'react';
import './App.css';

function App() {
  const [mood, setMood] = useState(''); // State to hold the user's mood
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [locationName, setLocationName] = useState("");

  const fetchRecommendation = () => {
    if (!mood) {
      alert("Please tell me how you're feeling!");
      return;
    }
    
    setIsLoading(true);
    setData(null);

    navigator.geolocation.getCurrentPosition(async (position) => {
      const { latitude, longitude } = position.coords;
      setLocationName(`Lat: ${latitude.toFixed(2)}, Lon: ${longitude.toFixed(2)}`);

      try {
        // We now send the mood as a "query parameter" in the URL
        const encodedMood = encodeURIComponent(mood);
        const response = await fetch(`http://localhost:3001/api/get-recommendation?lat=${latitude}&lon=${longitude}&mood=${encodedMood}`);
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Something went wrong on the server');
        }

        const responseData = await response.json();
        setData(responseData);

      } catch (error) {
        console.error("Failed to fetch recommendation:", error);
        alert(`Error: ${error.message}`);
      } finally {
        setIsLoading(false);
      }
    }, () => {
      alert("Unable to retrieve your location. Please enable location services.");
      setIsLoading(false);
    });
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>Mood & Weather Music</h1>

        {/* New text area for mood input */}
        <textarea
          className="mood-input"
          value={mood}
          onChange={(e) => setMood(e.target.value)}
          placeholder="How are you feeling today?"
          rows="3"
        />

        <button onClick={fetchRecommendation} disabled={isLoading}>
          {isLoading ? 'Getting Recommendation...' : 'Get Song Recommendation'}
        </button>

        {data && (
          <div className="result">
            <h2>Based on the weather at {locationName} and your mood...</h2>
            <p>Current Temperature: {data.weather.temperature}°C</p>
            <h3>Our Recommendation:</h3>
            <p className="song-title">"{data.recommendation.song}"</p>
            <p className="artist-name">by {data.recommendation.artist}</p>
          </div>
        )}
      </header>
    </div>
  );
}

export default App;