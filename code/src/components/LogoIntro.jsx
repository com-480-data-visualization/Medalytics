// src/components/LogoIntro.js
import { useEffect, useState } from 'react';

export default function LogoIntro() {
  // More reliable initialization with a function that checks the current theme
  const [isDarkMode, setIsDarkMode] = useState(() => {
    return document.documentElement.getAttribute('data-theme') === 'dark';
  });
  
  // Watch for theme changes
  useEffect(() => {
    // Force an immediate check when the component mounts
    setIsDarkMode(document.documentElement.getAttribute('data-theme') === 'dark');
    
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === 'data-theme') {
          setIsDarkMode(document.documentElement.getAttribute('data-theme') === 'dark');
        }
      });
    });
    
    observer.observe(document.documentElement, { attributes: true });
    
    // Clean up the observer
    return () => observer.disconnect();
  }, []);
  
  useEffect(() => {
    const logo = document.getElementById('mSvg');
    const container = document.getElementById('logoContainer');
    
    if (!logo || !container) return;
    
    // Add necessary CSS for the 3D effect with smoother transition
    logo.style.transition = 'transform 0.5s cubic-bezier(0.2, 0.8, 0.3, 1)';
    logo.style.transformStyle = 'preserve-3d';
    container.style.perspective = '1000px';
    
    let targetRotateX = 0;
    let targetRotateY = 0;
    let currentRotateX = 0;
    let currentRotateY = 0;
    let animationFrameId = null;
    
    const handleMouseMove = (e) => {
      // Get logo position and dimensions
      const logoRect = logo.getBoundingClientRect();
      const logoX = logoRect.left + logoRect.width / 2;
      const logoY = logoRect.top + logoRect.height / 2;
      
      // Calculate distance from mouse to logo center
      const deltaX = e.clientX - logoX;
      const deltaY = e.clientY - logoY;
      
      // Distance from mouse to logo (in pixels)
      const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
      
      // Maximum distance to consider (in pixels)
      const maxDistance = 500;
      
      // Calculate intensity factor (1 when mouse is at logo, 0 when far away)
      const intensityFactor = Math.max(0, 1 - Math.min(distance / maxDistance, 1));
      
      // Maximum rotation in degrees
      const maxRotation = 45;
      
      // Normalize deltas to -1 to 1 range based on distance
      const normalizedDeltaX = deltaX / maxDistance;
      const normalizedDeltaY = deltaY / maxDistance;
      
      // Set target rotation values with proximity intensity
      targetRotateY = -normalizedDeltaX * maxRotation * (intensityFactor * 2);
      targetRotateX = normalizedDeltaY * maxRotation * (intensityFactor * 2);
      
      // Start animation if not already running
      if (!animationFrameId) {
        animationFrameId = requestAnimationFrame(animateRotation);
      }
    };
    
    // Smooth animation function
    const animateRotation = () => {
      // Interpolate current values towards target (easing)
      const ease = 0.1; // Lower value = smoother but slower
      
      currentRotateX = currentRotateX + (targetRotateX - currentRotateX) * ease;
      currentRotateY = currentRotateY + (targetRotateY - currentRotateY) * ease;
      
      // Apply the rotation
      logo.style.transform = `rotateY(${currentRotateY}deg) rotateX(${currentRotateX}deg)`;
      
      // Continue animation
      animationFrameId = requestAnimationFrame(animateRotation);
    };
    
    // Reset rotation when mouse leaves window
    const resetRotation = () => {
      targetRotateX = 0;
      targetRotateY = 0;
    };
    
    // Add event listeners
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseleave', resetRotation);
    
    // Start initial animation
    animationFrameId = requestAnimationFrame(animateRotation);
    
    // Clean up
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseleave', resetRotation);
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, []);
  
  // SVG logo with dynamic fill color
  const logoSvg = (
    <svg id="mSvg" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 342 158" className="m-svg">
      <path 
        fill={isDarkMode ? "var(--off-white)" : "var(--dark-charcoal)"} 
        d="M117.626,157.952l-.893-9.457c22.956-2.168,40.266-21.213,40.266-44.302,0-.491-.009-.973-.026-1.454l4.667-.196.97-4.648.51.136h0l.125.033,3.102,1.051.121,3.272c.022.598.033,1.196.033,1.806,0,28.018-21.011,51.129-48.874,53.759h0Z"
      />
      <path 
        fill={isDarkMode ? "var(--off-white)" : "var(--dark-charcoal)"} 
        d="M224.374,157.952c-27.863-2.63-48.874-25.741-48.874-53.759,0-.611.011-1.211.034-1.81l.404-3.641,4.382-.939.004,4.762,4.702.179c-.018.48-.026.96-.026,1.45,0,23.089,17.311,42.134,40.267,44.302l-.893,9.457h0Z"
      />
      <path 
        fill={isDarkMode ? "var(--off-white)" : "var(--dark-charcoal)"} 
        d="M171,108.194c-3.426,0-6.851-.325-10.178-.966l1.797-9.329c5.472,1.055,11.288,1.055,16.764,0l1.795,9.329c-3.327.641-6.752.966-10.178.966Z"
      />
      <path 
        fill={isDarkMode ? "var(--off-white)" : "var(--dark-charcoal)"} 
        d="M179.019,107.641l-3.473-2.864-.015-2.34.003-.08c.84-25,19.26-46.532,43.798-51.199l5.828-1.108-.193,5.93c-.814,25-19.213,46.55-43.748,51.242l-2.2.421v-.002ZM214.765,62.2c-14.94,5.271-26.143,18.382-29.03,33.986,14.937-5.266,26.142-18.382,29.03-33.986Z"
      />
      <path 
        fill={isDarkMode ? "var(--off-white)" : "var(--dark-charcoal)"} 
        d="M161.647,107.297c-.305,0-.612-.029-.918-.088h-.001c-24.503-4.712-42.88-26.258-43.694-51.232l-.193-5.93,5.829,1.108c24.514,4.663,42.933,26.172,43.796,51.145l.08,2.292-1.775,1.55c-.884.753-1.986,1.154-3.122,1.154h-.002ZM127.235,62.201c2.891,15.597,14.093,28.714,29.033,33.985-2.884-15.593-14.092-28.713-29.033-33.985Z"
      />
    </svg>
  );
  
  return (
    <div className="logo-container" id="logoContainer">
      {logoSvg}
      <div 
        className="logo-text" 
        id="logoText"
      >
        Medalytics
      </div>
    </div>
  );
}