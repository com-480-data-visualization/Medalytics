import React, { useState, useEffect, useRef } from 'react';
import Papa from 'papaparse';
import './css/OlympicPodium.css';

const OlympicPodium = () => {
  const [countries, setCountries] = useState([]);
  const [selectedCountry, setSelectedCountry] = useState('');
  const [topAthletes, setTopAthletes] = useState([]);
  const [allAthletes, setAllAthletes] = useState([]); // All athletes for a country
  const [selectedAthlete, setSelectedAthlete] = useState(null);
  const [showAthleteDetails, setShowAthleteDetails] = useState(false);
  const [showAllAthletes, setShowAllAthletes] = useState(false); // New state to track full list view
  const [loading, setLoading] = useState(true);
  const [transition, setTransition] = useState({
    podiumActive: true,
    detailsActive: false,
    allAthletesActive: false, // New transition state
    medalDetailsActive: false // New transition state for medal details
  });
  const [biosData, setBiosData] = useState({});
  const [failedImages, setFailedImages] = useState({});
  const [animationKey, setAnimationKey] = useState(0); // Key to force animation reset
  const [resultsData, setResultsData] = useState({}); // Store athlete results data
  const [showMedalDetails, setShowMedalDetails] = useState(false); // State to toggle medal details view
  const [searchTerm, setSearchTerm] = useState(''); // Search term state
  const [allAthletesFlat, setAllAthletesFlat] = useState([]); // Flattened array of all athletes for global search
  const [searchActive, setSearchActive] = useState(false); // Track if search is active
  const [searchFocused, setSearchFocused] = useState(false);

  // Handle image load error
  const handleImageError = (athleteName) => {
    setFailedImages(prev => ({
      ...prev,
      [athleteName]: true
    }));
  };

  // Get athlete image URL from Olympedia.org using athlete_id
  const getAthleteImageUrl = (athleteName) => {
    // If this athlete's image previously failed to load, use fallback
    if (failedImages[athleteName]) {
      return "/athlete.png";
    }
    
    const bio = biosData[athleteName];
    if (bio && bio.athlete_id) {
      return `https://d2a3o6pzho379u.cloudfront.net/${bio.athlete_id}.jpg`;
    }
    return "/athlete.png"; // Fallback to default image
  };

  // Create a flattened array of all athletes for global search
  useEffect(() => {
    if (!loading && Object.keys(allAthletes).length > 0) {
      const flattenedAthletes = [];
      Object.keys(allAthletes).forEach(country => {
        allAthletes[country].forEach(athlete => {
          flattenedAthletes.push({
            ...athlete,
            country: country
          });
        });
      });
      setAllAthletesFlat(flattenedAthletes);
    }
  }, [allAthletes, loading]);

  // Reset search when changing views
  useEffect(() => {
    if (!searchActive) {
      setSearchTerm('');
    }
  }, [showAthleteDetails, showAllAthletes, showMedalDetails, searchActive]);

  // Handle search input change
  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    setSearchActive(value.trim().length > 0);
  };

  // Handle search input focus
  const handleSearchFocus = () => {
    setSearchFocused(true);
  };

  // Handle search input blur
  const handleSearchBlur = () => {
    if (!searchTerm) {
      setSearchFocused(false);
    }
  };

  // Toggle search visibility
  const toggleSearch = () => {
    setSearchFocused(true);
    // Focus the input field after expanding
    setTimeout(() => {
      document.querySelector('.search-input')?.focus();
    }, 50);
  };

  // Modern search icon SVG
  const SearchIcon = () => (
    <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
    </svg>
  );

  // Load country list, athlete data and bios data
  useEffect(() => {
    const loadData = async () => {
      try {
        // Load top athletes data
        const topAthletesResponse = await fetch('/top_athletes.csv');
        const topAthletesCsvText = await topAthletesResponse.text();
        
        const topAthletesResults = Papa.parse(topAthletesCsvText, {
          header: true,
          skipEmptyLines: true
        });
        
        // Extract unique countries
        const uniqueCountries = [...new Set(topAthletesResults.data.map(row => row.country))].sort();
        setCountries(uniqueCountries);
        
        // Create a map of country to athletes (top 3)
        const athletesByCountry = {};
        const allAthletesByCountry = {};
        
        uniqueCountries.forEach(country => {
          const countryAllAthletes = topAthletesResults.data
            .filter(row => row.country === country)
            .map((athlete, index) => ({
              name: athlete.name,
              bronze: parseInt(athlete.Bronze) || 0,
              silver: parseInt(athlete.Silver) || 0,
              gold: parseInt(athlete.Gold) || 0,
              totalMedals: (parseInt(athlete.Bronze) || 0) + (parseInt(athlete.Silver) || 0) + (parseInt(athlete.Gold) || 0)
            }))
            .sort((a, b) => {
              // First sort by gold medals (descending)
              if (b.gold !== a.gold) {
                return b.gold - a.gold;
              }
              // If tied on gold, sort by silver (descending)
              if (b.silver !== a.silver) {
                return b.silver - a.silver;
              }
              // If tied on gold and silver, sort by bronze (descending)
              return b.bronze - a.bronze;
            })
            .map((athlete, index) => ({
              ...athlete,
              position: index + 1
            }));
            
          // Store all athletes for this country
          allAthletesByCountry[country] = countryAllAthletes;
          
          // Take only top 3 for the podium view
          athletesByCountry[country] = countryAllAthletes.slice(0, 3);
        });
        
        setTopAthletes(athletesByCountry);
        setAllAthletes(allAthletesByCountry);
        
        // Load bios data
        const biosResponse = await fetch('/bios.csv');
        const biosCsvText = await biosResponse.text();
        
        const biosResults = Papa.parse(biosCsvText, {
          header: true,
          skipEmptyLines: true
        });
        
        // Create a map of athlete name to their bio data
        const biosMap = {};
        biosResults.data.forEach(bio => {
          if (bio.name) {
            biosMap[bio.name] = bio;
          }
        });
        
        setBiosData(biosMap);
        
        // Load results data
        const resultsResponse = await fetch('/results.csv');
        const resultsCsvText = await resultsResponse.text();
        
        const resultsResults = Papa.parse(resultsCsvText, {
          header: true,
          skipEmptyLines: true
        });
        
        // Create a map of athlete name to their results data
        const resultsMap = {};
        resultsResults.data.forEach(result => {
          if (result.as) { // 'as' is the athlete name in results.csv
            const athleteName = result.as;
            if (!resultsMap[athleteName]) {
              resultsMap[athleteName] = [];
            }
            resultsMap[athleteName].push(result);
          }
        });
        
        setResultsData(resultsMap);
        setLoading(false);
      } catch (error) {
        console.error("Error loading data:", error);
        setLoading(false);
      }
    };
    
    loadData();
  }, []);

  // Calculate age from birth date and death date
  const calculateAge = (birthDate, deathDate) => {
    if (!birthDate) return 'Unknown';
    
    const birth = new Date(birthDate);
    const end = deathDate ? new Date(deathDate) : new Date();
    
    // Check for invalid dates
    if (isNaN(birth.getTime())) return 'Unknown';
    
    let age = end.getFullYear() - birth.getFullYear();
    const m = end.getMonth() - birth.getMonth();
    
    if (m < 0 || (m === 0 && end.getDate() < birth.getDate())) {
      age--;
    }
    
    if (deathDate) {
      return `${age} (Deceased)`;
    }
    
    return age.toString();
  };

  // Handle country selection
  const handleCountryChange = (e) => {
    const newCountry = e.target.value;
    
    if (newCountry !== selectedCountry) {
      // Trigger animation reset by changing the key
      setAnimationKey(prevKey => prevKey + 1);
    }
    
    setSelectedCountry(newCountry);
    
    // Reset views
    if (showAthleteDetails || showAllAthletes || showMedalDetails) {
      // First hide current view with animation
      setTransition({
        podiumActive: false,
        detailsActive: false,
        allAthletesActive: false,
        medalDetailsActive: false
      });
      
      // After animation, switch to podium view
      setTimeout(() => {
        setShowAthleteDetails(false);
        setShowAllAthletes(false);
        setShowMedalDetails(false);
        setTransition({
          podiumActive: true,
          detailsActive: false,
          allAthletesActive: false,
          medalDetailsActive: false
        });
      }, 400);
    }
  };

  // Handle See More button click
  const handleSeeMoreClick = () => {
    // First hide podium view with animation
    setTransition({
      podiumActive: false,
      detailsActive: false,
      allAthletesActive: false,
      medalDetailsActive: false
    });
    
    // After animation, switch to all athletes view
    setTimeout(() => {
      setShowAllAthletes(true);
      setShowAthleteDetails(false);
      setShowMedalDetails(false);
      setTransition({
        podiumActive: false,
        detailsActive: false,
        allAthletesActive: true,
        medalDetailsActive: false
      });
    }, 400);
  };

  // Handle back to podium from all athletes view
  const handleBackToPodiumFromList = () => {
    // First hide all athletes view with animation
    setTransition({
      podiumActive: false,
      detailsActive: false,
      allAthletesActive: false,
      medalDetailsActive: false
    });
    
    // After animation, switch to podium view
    setTimeout(() => {
      setShowAllAthletes(false);
      setShowMedalDetails(false);
      setTransition({
        podiumActive: true,
        detailsActive: false,
        allAthletesActive: false,
        medalDetailsActive: false
      });
    }, 400);
  };

  // Handle athlete click
  const handleAthleteClick = (athlete) => {
    setSelectedAthlete(athlete);
    
    // First hide current view with animation
    setTransition({
      podiumActive: false,
      detailsActive: false,
      allAthletesActive: false,
      medalDetailsActive: false
    });
    
    // After animation, switch to details view
    setTimeout(() => {
      setShowAthleteDetails(true);
      setShowMedalDetails(false);
      setTransition({
        podiumActive: false,
        detailsActive: true,
        allAthletesActive: false,
        medalDetailsActive: false
      });
    }, 400);
  };
  
  // Open medal details view
  const showMedalDetailsView = () => {
    // First hide athlete details view with animation
    setTransition({
      podiumActive: false,
      detailsActive: false,
      allAthletesActive: false,
      medalDetailsActive: false
    });
    
    // After animation, switch to medal details view
    setTimeout(() => {
      setShowMedalDetails(true);
      setShowAthleteDetails(false);
      setTransition({
        podiumActive: false,
        detailsActive: false,
        allAthletesActive: false,
        medalDetailsActive: true
      });
    }, 400);
  };

  // Go back to athlete details from medal details
  const handleBackToAthleteDetails = () => {
    // First hide medal details view with animation
    setTransition({
      podiumActive: false,
      detailsActive: false,
      allAthletesActive: false,
      medalDetailsActive: false
    });
    
    // After animation, switch to athlete details view
    setTimeout(() => {
      setShowMedalDetails(false);
      setShowAthleteDetails(true);
      setTransition({
        podiumActive: false,
        detailsActive: true,
        allAthletesActive: false,
        medalDetailsActive: false
      });
    }, 400);
  };

  // Go back to podium view from athlete details
  const handleBackToPodium = () => {
    // First hide details view with animation
    setTransition({
      podiumActive: false,
      detailsActive: false,
      allAthletesActive: false,
      medalDetailsActive: false
    });
    
    // If we came from the all athletes view, go back there
    setTimeout(() => {
      if (showAllAthletes) {
        setShowAthleteDetails(false);
        setShowMedalDetails(false);
        setTransition({
          podiumActive: false,
          detailsActive: false,
          allAthletesActive: true,
          medalDetailsActive: false
        });
      } else {
        // Otherwise go back to podium
        setShowAthleteDetails(false);
        setShowMedalDetails(false);
        setTransition({
          podiumActive: true,
          detailsActive: false,
          allAthletesActive: false,
          medalDetailsActive: false
        });
      }
    }, 400);
  };

  // Render search bar component
  const renderSearchBar = () => {
    return (
      <div className={`search-container ${searchFocused || searchActive ? 'expanded' : ''}`}>
        <input 
          type="text" 
          className="search-input" 
          placeholder="Search athletes..." 
          value={searchTerm}
          onChange={handleSearchChange}
          onFocus={handleSearchFocus}
          onBlur={handleSearchBlur}
        />
        {searchActive && (
          <button 
            className="clear-search-button" 
            onClick={() => {
              setSearchTerm('');
              setSearchActive(false);
            }}
          >
            &times;
          </button>
        )}
        <button className="search-icon-button" onClick={toggleSearch}>
          <span className="search-icon">
            <SearchIcon />
          </span>
        </button>
      </div>
    );
  };

  // Render search results for main page (global search across all countries)
  const renderGlobalSearchResults = () => {
    if (!searchTerm.trim()) return null;
    
    const filteredAthletes = allAthletesFlat.filter(athlete => 
      athlete.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
    
    if (filteredAthletes.length === 0) {
      return (
        <div className="no-search-results">
          No athletes found matching "{searchTerm}"
        </div>
      );
    }
    
    return (
      <div className="global-search-results">
        <h3>Search Results</h3>
        <div className="athletes-list">
          {filteredAthletes.slice(0, 20).map((athlete) => (
            <div 
              key={athlete.name + athlete.country}
              className="athlete-list-item"
              onClick={() => {
                setSelectedCountry(athlete.country);
                handleAthleteClick(athlete);
              }}
            >
              <div className="athlete-list-image">
                <img 
                  src={getAthleteImageUrl(athlete.name)} 
                  alt={athlete.name} 
                  onError={() => handleImageError(athlete.name)}
                />
              </div>
              <div className="athlete-list-details">
                <div className="athlete-list-name">{athlete.name}</div>
                <div className="athlete-list-country">{athlete.country}</div>
              </div>
              <div className="athlete-list-medals">
                <div className="medal-mini gold">
                  <span className="medal-mini-count">{athlete.gold}</span>
                  <span className="medal-mini-label">G</span>
                </div>
                <div className="medal-mini silver">
                  <span className="medal-mini-count">{athlete.silver}</span>
                  <span className="medal-mini-label">S</span>
                </div>
                <div className="medal-mini bronze">
                  <span className="medal-mini-count">{athlete.bronze}</span>
                  <span className="medal-mini-label">B</span>
                </div>
              </div>
            </div>
          ))}
          {filteredAthletes.length > 20 && (
            <div className="more-results-message">
              Showing 20 of {filteredAthletes.length} results
            </div>
          )}
        </div>
      </div>
    );
  };

  // Render podium view
  const renderPodiumView = () => {
    if (loading) {
      return (
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading athlete data...</p>
        </div>
      );
    }
    
    if (searchActive) {
      return renderGlobalSearchResults();
    }
    
    // Default athletes when no country is selected
    const defaultAthletes = [
      { name: "Athlete", bronze: 0, silver: 0, gold: 0, position: 1 },
      { name: "Athlete", bronze: 0, silver: 0, gold: 0, position: 2 },
      { name: "Athlete", bronze: 0, silver: 0, gold: 0, position: 3 }
    ];
    
    // Use default athletes if no country selected, otherwise use the country's athletes
    const displayAthletes = !selectedCountry ? defaultAthletes : 
                           (topAthletes[selectedCountry]?.length > 0 ? 
                            topAthletes[selectedCountry] : defaultAthletes);
    
    return (
      <div className="podium-display">
        {!selectedCountry && (
          <div className="no-selection-message">
            Please select a country to see its top athletes.
          </div>
        )}
        
        {selectedCountry && (
          <div className="podium-container" key={animationKey}>
            {/* Arrange athletes based on their position */}
            {displayAthletes.map((athlete) => (
              <div 
                key={athlete.name + athlete.position} 
                className={`podium-position position-${athlete.position}`}
                onClick={() => selectedCountry && handleAthleteClick(athlete)}
                style={{ cursor: selectedCountry ? 'pointer' : 'default' }}
              >
                <div className="athlete-image-container">
                  <img 
                    src={selectedCountry ? getAthleteImageUrl(athlete.name) : "/athlete.png"} 
                    alt={`${athlete.name}`} 
                    className="athlete-image"
                    onError={() => handleImageError(athlete.name)}
                  />
                </div>
                <div className="athlete-name">{athlete.name}</div>
                <div className={`podium-block podium-${athlete.position}`}>
                  <span className="position-number">{athlete.position}</span>
                </div>
              </div>
            ))}
          </div>
        )}
        
        {!searchActive && selectedCountry && (
          <div className="see-more-container">
            <button 
              className="see-more-button"
              onClick={handleSeeMoreClick}
              disabled={!selectedCountry}
              style={{ opacity: selectedCountry ? 1 : 0.5 }}
            >
              See All
            </button>
          </div>
        )}
      </div>
    );
  };

  // Render all athletes view
  const renderAllAthletesView = () => {
    if (!selectedCountry || !allAthletes[selectedCountry]) {
      return (
        <div className="no-selection-message">
          No athletes found for the selected country.
        </div>
      );
    }
    
    // Filter athletes based on search term if search is active
    const filteredAthletes = searchActive 
      ? allAthletes[selectedCountry].filter(athlete => 
          athlete.name.toLowerCase().includes(searchTerm.toLowerCase())
        )
      : allAthletes[selectedCountry];
    
    return (
      <div className="all-athletes-container">
        <div className="all-athletes-header">
          <button className="back-button" onClick={handleBackToPodiumFromList}>
            &larr; Back
          </button>
          <h2>
            {searchActive 
              ? `Search Results for "${searchTerm}"` 
              : `All Olympic Athletes for ${selectedCountry}`}
          </h2>
        </div>
        
        {filteredAthletes.length === 0 ? (
          <div className="no-search-results">
            No athletes found matching "{searchTerm}"
          </div>
        ) : (
          <div className="athletes-list">
            {filteredAthletes.map((athlete) => (
              <div 
                key={athlete.name}
                className="athlete-list-item"
                onClick={() => handleAthleteClick(athlete)}
              >
                <div className="athlete-list-rank">#{athlete.position}</div>
                <div className="athlete-list-image">
                  <img 
                    src={getAthleteImageUrl(athlete.name)} 
                    alt={athlete.name} 
                    onError={() => handleImageError(athlete.name)}
                  />
                </div>
                <div className="athlete-list-name">{athlete.name}</div>
                <div className="athlete-list-medals">
                  <div className="medal-mini gold">
                    <span className="medal-mini-count">{athlete.gold}</span>
                    <span className="medal-mini-label">G</span>
                  </div>
                  <div className="medal-mini silver">
                    <span className="medal-mini-count">{athlete.silver}</span>
                    <span className="medal-mini-label">S</span>
                  </div>
                  <div className="medal-mini bronze">
                    <span className="medal-mini-count">{athlete.bronze}</span>
                    <span className="medal-mini-label">B</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };
  
  // Render athlete medals details view
  const renderMedalDetailsView = () => {
    if (!selectedAthlete) return null;
    
    // Get athlete results
    const athleteResults = resultsData[selectedAthlete.name] || [];
    
    // Sort by year in descending order
    const sortedResults = [...athleteResults].sort((a, b) => parseFloat(b.year) - parseFloat(a.year));
    
    return (
      <div className={`medal-details-page ${transition.medalDetailsActive ? 'active' : ''}`}>
        <div className="medal-details-header">
          <button className="back-button" onClick={handleBackToAthleteDetails}>
            &larr; Back
          </button>
          <h2>Olympic Results for {selectedAthlete.name}</h2>
        </div>
        
        <div className="medal-details-content">
          {sortedResults.length === 0 ? (
            <div className="no-medals-message">
              No detailed results found for this athlete.
            </div>
          ) : (
            <div className="medals-list">
              {sortedResults.map((result, index) => (
                <div 
                  key={index}
                  className={`medal-detail-item ${result.medal ? 'with-medal' : ''}`}
                >
                  <div className="medal-detail-year">{Math.floor(parseFloat(result.year))}</div>
                  <div className="medal-detail-info">
                    <div className="medal-detail-event">
                      <strong>Event:</strong> {result.event} 
                    </div>
                    <div className="medal-detail-discipline">
                      <strong>Sport:</strong> {result.discipline}
                    </div>
                    <div className="medal-detail-position">
                      <strong>Position:</strong> {result.place || 'Not Ranked'}
                      {result.medal && (
                        <span className={`medal-badge ${result.medal.toLowerCase()}`}>
                          {result.medal}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  // Render athlete details view
  const renderAthleteDetailsView = () => {
    if (!selectedAthlete) return null;
    
    // Get bio data if available
    const bio = biosData[selectedAthlete.name] || {};
    const age = calculateAge(bio.born_date, bio.died_date);
    const birthCity = bio.born_city || 'Unknown';
    const height = bio.height_cm ? `${bio.height_cm} cm` : 'Unknown';
    const weight = bio.weight_kg ? `${bio.weight_kg} kg` : 'Unknown';
    
    return (
      <div className={`athlete-details-page ${transition.detailsActive ? 'active' : ''}`}>
        <div className="athlete-details-header">
          <button className="back-button" onClick={handleBackToPodium}>
            &larr; Back
          </button>
          <h2>{selectedAthlete.name}</h2>
        </div>
        
        <div className="athlete-details-content">
          <div className="athlete-profile">
            <div className="athlete-image-large">
              <img 
                src={getAthleteImageUrl(selectedAthlete.name)} 
                alt={selectedAthlete.name}
                onError={() => handleImageError(selectedAthlete.name)}
              />
            </div>
            
            <div className="athlete-info">
              <div className="athlete-info-header">
                <p><strong>Country:</strong> {selectedCountry}</p>
                <p><strong>Position:</strong> #{selectedAthlete.position} in country rankings</p>
              </div>
              
              <h3>Olympic Medals</h3>
              <div className="medal-counts">
                <div className="medal gold">
                  <div className="medal-icon-wrapper">
                    <span className="medal-count">{selectedAthlete.gold}</span>
                  </div>
                  <span className="medal-label">Gold</span>
                </div>
                <div className="medal silver">
                  <div className="medal-icon-wrapper">
                    <span className="medal-count">{selectedAthlete.silver}</span>
                  </div>
                  <span className="medal-label">Silver</span>
                </div>
                <div className="medal bronze">
                  <div className="medal-icon-wrapper">
                    <span className="medal-count">{selectedAthlete.bronze}</span>
                  </div>
                  <span className="medal-label">Bronze</span>
                </div>
              </div>
              
              <div className="view-medals-button-container">
                <button 
                  className="view-medals-button"
                  onClick={showMedalDetailsView}
                >
                  View All Olympic Results
                </button>
              </div>
              
              <h3>Athlete Information</h3>
              <div className="athlete-stats">
                <div className="stats-grid">
                  <div className="stat-item">
                    <p className="stat-label">Age</p>
                    <p className="stat-value">{age}</p>
                  </div>
                  <div className="stat-item">
                    <p className="stat-label">Birth City</p>
                    <p className="stat-value">{birthCity}</p>
                  </div>
                  <div className="stat-item">
                    <p className="stat-label">Height</p>
                    <p className="stat-value">{height}</p>
                  </div>
                  <div className="stat-item">
                    <p className="stat-label">Weight</p>
                    <p className="stat-value">{weight}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="olympic-podium-wrapper">
      <div className="olympic-podium-main-container">
        {showMedalDetails ? (
          renderMedalDetailsView()
        ) : showAthleteDetails ? (
          renderAthleteDetailsView()
        ) : showAllAthletes ? (
          <div className={`all-athletes-view ${transition.allAthletesActive ? 'active' : ''}`}>
            {renderSearchBar()}
            {renderAllAthletesView()}
          </div>
        ) : (
          <div className={`podium-view-container ${transition.podiumActive ? 'active' : ''}`}>
            <h2>Olympic Podium</h2>
            {renderSearchBar()}
            
            {!searchActive && (
              <div className="search-and-filter-container">
                <div className="country-selector">
                  <label htmlFor="country-select">Select Country:</label>
                  <select 
                    id="country-select" 
                    value={selectedCountry} 
                    onChange={handleCountryChange}
                    className="country-select"
                  >
                    <option value="">-- Select a Country --</option>
                    {countries.map(country => (
                      <option key={country} value={country}>{country}</option>
                    ))}
                  </select>
                </div>
              </div>
            )}
            
            {renderPodiumView()}
          </div>
        )}
      </div>
    </div>
  );
};

export default OlympicPodium; 