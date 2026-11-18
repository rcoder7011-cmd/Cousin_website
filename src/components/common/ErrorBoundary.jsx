import React from 'react';

/**
 * Production-grade React Error Boundary
 * Catches rendering exceptions anywhere in the subtree and displays a helpful,
 * branded fallback view instead of a blank screen.
 */
export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('[ErrorBoundary caught error]:', error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '80vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '2rem 1.5rem',
          backgroundColor: '#fbfaf8',
          fontFamily: "'Plus Jakarta Sans', sans-serif"
        }}>
          <div style={{
            maxWidth: '540px',
            width: '100%',
            background: '#ffffff',
            borderRadius: '12px',
            border: '1px solid #e6e0d5',
            padding: '2.5rem',
            textAlign: 'center',
            boxShadow: '0 8px 30px rgba(0,0,0,0.06)'
          }}>
            <img
              src="/Website_Logo.png"
              alt="Saifi Interior Hub"
              style={{ maxHeight: '46px', width: 'auto', margin: '0 auto 1.25rem', display: 'block', objectFit: 'contain' }}
            />
            <div style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              background: 'rgba(197, 160, 89, 0.15)',
              color: '#b38838',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1.5rem',
              fontSize: '1.5rem',
              fontWeight: 700
            }}>
              !
            </div>
            <h1 style={{
              fontSize: '1.5rem',
              color: '#121316',
              marginBottom: '0.75rem',
              fontWeight: 700
            }}>
              Something went wrong
            </h1>
            <p style={{
              color: '#4e515b',
              fontSize: '0.95rem',
              lineHeight: 1.6,
              marginBottom: '1.75rem'
            }}>
              We encountered an unexpected display issue. Your data is secure, and you can reload the page or return to the main showcase.
            </p>
            {this.props.showDetails && this.state.error && (
              <pre style={{
                textAlign: 'left',
                background: '#f4efe8',
                padding: '1rem',
                borderRadius: '6px',
                fontSize: '0.8rem',
                overflowX: 'auto',
                color: '#dc2626',
                marginBottom: '1.5rem'
              }}>
                {this.state.error.toString()}
              </pre>
            )}
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={this.handleReload}
                style={{
                  background: '#121316',
                  color: '#ffffff',
                  border: 'none',
                  padding: '0.75rem 1.5rem',
                  borderRadius: '6px',
                  fontWeight: 600,
                  fontSize: '0.9rem',
                  cursor: 'pointer'
                }}
              >
                Reload Page
              </button>
              <button
                type="button"
                onClick={this.handleReset}
                style={{
                  background: '#ffffff',
                  color: '#121316',
                  border: '1px solid #121316',
                  padding: '0.75rem 1.5rem',
                  borderRadius: '6px',
                  fontWeight: 600,
                  fontSize: '0.9rem',
                  cursor: 'pointer'
                }}
              >
                Return to Homepage
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
