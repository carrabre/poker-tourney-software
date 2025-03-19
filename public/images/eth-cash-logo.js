// ETH.cash logo as a React component
export const EthCashLogo = ({ width = 40, height = 40, className = '' }) => {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      viewBox="0 0 100 100" 
      width={width} 
      height={height}
      className={className}
    >
      {/* Background Circle */}
      <circle cx="50" cy="50" r="48" fill="#F7C94A" />
      
      {/* Ethereum Diamond Shape */}
      <g transform="translate(30, 20) scale(0.4)">
        <path fill="#FFFFFF" d="M50,0 L0,68 L50,93 L100,68 L50,0z"/>
        <path fill="#EFEFEF" d="M50,0 L0,68 L50,93 L50,0z"/>
        <path fill="#FFFFFF" d="M50,93 L100,68 L50,50 L0,68 L50,93z"/>
        <path fill="#EFEFEF" d="M50,93 L50,50 L0,68 L50,93z"/>
      </g>
      
      {/* Text Elements */}
      <text 
        x="50" 
        y="65" 
        fontFamily="Arial, sans-serif" 
        fontSize="14" 
        fontWeight="bold" 
        textAnchor="middle" 
        fill="#FFFFFF"
      >
        .cash
      </text>
    </svg>
  );
};

export default EthCashLogo; 