import { useState } from 'react';
import './App.css';

function App() {
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    // Client-side validation
    if (!validateEmail(email)) {
      setError('Invalid email format');
      return;
    }

    try {
      const response = await fetch('http://localhost:3000/api/users/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, username }),
      });

      const data = await response.json();

      if (!response.ok) {
        // Handle error response
        setError(data.error || 'Registration failed');
        return;
      }

      // Clear form and show success message
      setEmail('');
      setUsername('');
      setSuccess(true);
    } catch (err) {
      setError('An unexpected error occurred');
    }
  };

  return (
    <div className="App">
      <h1>User Registration</h1>
      <form onSubmit={handleSubmit} data-testid="registration-form">
        <div>
          <label htmlFor="email">Email:</label>
          <input
            type="text"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            data-testid="email-input"
          />
        </div>
        <div>
          <label htmlFor="username">Username:</label>
          <input
            type="text"
            id="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            data-testid="username-input"
          />
        </div>
        <button type="submit" data-testid="submit-button">Register</button>
      </form>

      {error && (
        <div className="error" data-testid="error-message">
          {error}
        </div>
      )}
      
      {success && (
        <div className="success" data-testid="success-message">
          Registration successful!
        </div>
      )}
    </div>
  );
}

export default App; 