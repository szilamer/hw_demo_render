import React from 'react';

interface HealthMetric {
  name: string;
  value: number;
  secondaryValue?: number;
  unit: string;
  status: 'normal' | 'warning' | 'critical';
  icon: string;
  reference?: {
    min: number;
    max: number;
    secondaryMin?: number;
    secondaryMax?: number;
  };
}

interface HealthMetricsProps {
  metrics: HealthMetric[];
}

const HealthMetrics: React.FC<HealthMetricsProps> = ({ metrics }) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'normal':
        return '#4CAF50';
      case 'warning':
        return '#FFC107';
      case 'critical':
        return '#F44336';
      default:
        return '#757575';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'normal':
        return 'Normál';
      case 'warning':
        return 'Figyelmeztető';
      case 'critical':
        return 'Kritikus';
      default:
        return 'Ismeretlen';
    }
  };

  const getGaugeRotation = (value: number, metric: HealthMetric, isSecondary: boolean = false) => {
    if (!metric.reference) return 0;
    const { min, max, secondaryMin, secondaryMax } = metric.reference;
    
    if (isSecondary && secondaryMin && secondaryMax) {
      const percentage = ((value - secondaryMin) / (secondaryMax - secondaryMin)) * 100;
      return Math.min(Math.max((percentage * 1.8) - 90, -90), 90);
    } else {
      const percentage = ((value - min) / (max - min)) * 100;
      return Math.min(Math.max((percentage * 1.8) - 90, -90), 90);
    }
  };

  return (
    <div className="health-metrics">
      <h3>Egészségügyi Mérőszámok</h3>
      <div className="metrics-grid">
        {metrics.map((metric, index) => (
          <div key={index} className="metric-card" style={{ borderLeft: `4px solid ${getStatusColor(metric.status)}` }}>
            <div className="metric-header">
              <span className="metric-icon">{metric.icon}</span>
              <span className="metric-name">{metric.name}</span>
            </div>
            {metric.reference ? (
              <div className="gauge-container">
                <div className="gauge">
                  <div 
                    className="gauge-needle"
                    style={{ 
                      transform: `rotate(${getGaugeRotation(metric.value, metric)}deg)`,
                      backgroundColor: getStatusColor(metric.status)
                    }}
                  />
                  {metric.secondaryValue && metric.reference.secondaryMin && metric.reference.secondaryMax && (
                    <div 
                      className="gauge-needle secondary"
                      style={{ 
                        transform: `rotate(${getGaugeRotation(metric.secondaryValue, metric, true)}deg)`,
                        backgroundColor: getStatusColor(metric.status)
                      }}
                    />
                  )}
                  <div className="gauge-scale">
                    <span>{metric.reference.min}</span>
                    <span>{metric.reference.max}</span>
                  </div>
                </div>
                <div className="gauge-value">
                  {metric.secondaryValue ? (
                    <>
                      {metric.value}/{metric.secondaryValue} {metric.unit}
                      <div className="gauge-label">
                        <small>Szisztolés/Diasztolés</small>
                      </div>
                    </>
                  ) : (
                    `${metric.value} ${metric.unit}`
                  )}
                </div>
                <div 
                  style={{ 
                    color: getStatusColor(metric.status),
                    fontSize: '0.9rem',
                    fontWeight: 500,
                    marginTop: '0.5rem'
                  }}
                >
                  {getStatusText(metric.status)}
                </div>
              </div>
            ) : (
              <div className="metric-value-simple">
                <span style={{ color: getStatusColor(metric.status) }}>
                  {metric.value} {metric.unit}
                </span>
                <div style={{ 
                  color: getStatusColor(metric.status),
                  fontSize: '0.9rem',
                  marginTop: '0.5rem'
                }}>
                  {getStatusText(metric.status)}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default HealthMetrics; 