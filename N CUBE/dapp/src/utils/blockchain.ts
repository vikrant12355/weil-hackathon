
export interface DecisionBlock {
  blockNumber: number;
  timestamp: string;
  decisionHash: string;
  previousBlockHash: string | null;
  aiAgent: string;
  confidenceScore: number;
  humanSignature?: string;
}

// In-memory simulation of the blockchain
const blockchain: DecisionBlock[] = [];

export function generateDecisionHash(data: Record<string, unknown>): string {
  const dataString = JSON.stringify(data);
  // Using Web Crypto API for browser compatibility, or node crypto if fallback needed.
  // Actually, since this might run on client, let's use a simple hash function or subtle crypto.
  // For simplicity in simulation, we can mock a hash or use a simple SHA256 simulation.
  // Since we require frontend compatibility, let's use a simple string hashing or just mock it.
  
  // Fake hash for simulation
  const mockSHA256 = (str: string) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32bit integer
    }
    return '0x' + Math.abs(hash).toString(16).padStart(16, '0') + Date.now().toString(16);
  };
  
  return mockSHA256(dataString);
}

export function storeDecisionBlock(
  aiAgent: string, 
  confidenceScore: number, 
  data: Record<string, unknown>, 
  humanSignature?: string
): DecisionBlock {
  const previousBlock = blockchain.length > 0 ? blockchain[blockchain.length - 1] : null;
  const previousBlockHash = previousBlock ? previousBlock.decisionHash : null;
  const blockNumber = blockchain.length + 1;
  const timestamp = new Date().toISOString();
  
  const blockData = {
    blockNumber,
    timestamp,
    previousBlockHash,
    aiAgent,
    confidenceScore,
    data,
    humanSignature
  };

  const decisionHash = generateDecisionHash(blockData);

  const newBlock: DecisionBlock = {
    blockNumber,
    timestamp,
    decisionHash,
    previousBlockHash,
    aiAgent,
    confidenceScore,
    humanSignature
  };

  blockchain.push(newBlock);
  return newBlock;
}

export function verifyDecision(hash: string): boolean {
  return blockchain.some(block => block.decisionHash === hash);
}

export function getBlockchainHistory(): DecisionBlock[] {
  return [...blockchain];
}
