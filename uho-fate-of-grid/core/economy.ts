import { Component, System } from './ecs.ts';
import type { EntityId } from './types.ts';
import type { SocialProfile } from './reputation.ts';

// Market item with supply/demand dynamics
export interface MarketItem {
  id: string;
  name: string;
  category: 'drugs' | 'weapons' | 'stolen_goods' | 'services' | 'information' | 'contraband';
  basePrice: number;           // Base market price
  currentPrice: number;        // Current market price
  supply: number;              // Available quantity in market
  demand: number;              // Current demand level (0-100)
  
  // Market factors
  heat: number;                // Police attention (0-100)
  quality: number;             // Item quality (0-100)
  rarity: number;              // How rare the item is (0-100)
  
  // Trading restrictions
  minReputation?: Record<string, number>; // Faction rep requirements
  heatLimit?: number;          // Max heat level to trade
  territoryRestricted?: boolean; // Only available in certain areas
  
  // Suppliers and routes
  suppliers: string[];         // Who supplies this item
  routes: TradingRoute[];      // How it gets to market
  
  // Market history
  priceHistory: Array<{ price: number; timestamp: number }>;
  demandHistory: Array<{ demand: number; timestamp: number }>;
}

// Trading route for smuggling operations
export interface TradingRoute {
  id: string;
  name: string;
  startLocation: string;
  endLocation: string;
  distance: number;            // Route length affects time/risk
  risk: number;                // Chance of police intervention (0-100)
  capacity: number;            // Max items per transport
  cost: number;                // Cost per transport
  
  // Route status
  active: boolean;
  lastUsed: number;            // Timestamp
  heatLevel: number;           // Route-specific heat (0-100)
  
  // Requirements
  skillRequirements?: Record<string, number>;
  factionControl?: string;     // Which faction controls this route
  vehicleRequired?: string;    // Required vehicle type
}

// Black market location
export interface BlackMarket {
  id: string;
  name: string;
  location: string;            // Map location
  type: 'street_corner' | 'warehouse' | 'nightclub' | 'safehouse' | 'mobile';
  
  // Market characteristics
  securityLevel: number;       // How safe the market is (0-100)
  discretion: number;          // How secretive (affects heat) (0-100)
  reputation: number;          // Market reputation (affects prices)
  
  // Available items and services
  itemCategories: string[];    // What categories are sold here
  services: string[];          // Additional services (laundering, etc.)
  
  // Access control
  entryRequirements?: {
    reputation?: Record<string, number>;
    introduction?: boolean;    // Need introduction from member
    paymentUpfront?: number;   // Entry fee
  };
  
  // Market modifiers
  priceModifier: number;       // Multiplier for all prices
  qualityModifier: number;     // Quality bonus/penalty
  
  // Management
  owner?: EntityId;            // Who runs this market
  protectedBy?: string;        // Which faction protects it
  lastRaid?: number;           // When was it last raided
}

// Supply chain network
export interface SupplyChain {
  itemId: string;
  nodes: SupplyNode[];
  routes: TradingRoute[];
  efficiency: number;          // How well the chain works (0-100)
  disrupted: boolean;          // Is the chain currently disrupted
}

export interface SupplyNode {
  id: string;
  type: 'source' | 'production' | 'storage' | 'distribution' | 'retail';
  location: string;
  capacity: number;
  currentStock: number;
  operatingCost: number;       // Daily cost to run
  
  // Node status
  operational: boolean;
  heatLevel: number;
  lastActivity: number;
  
  // Management
  controller?: EntityId;       // Who controls this node
  workers: EntityId[];         // NPCs working here
  
  // Production (for production nodes)
  productionRate?: number;     // Items produced per day
  inputRequired?: Array<{ itemId: string; quantity: number }>; // Required materials
}

// Component for tracking market participation
export class MarketParticipant extends Component {
  public reputation: Record<string, number> = {}; // Market-specific reputation
  public contacts: EntityId[] = [];               // Trading contacts
  public routes: string[] = [];                   // Known routes
  public markets: string[] = [];                  // Access to markets
  public inventory: Map<string, number> = new Map(); // Items for trading
  
  // Trading history
  public transactions: Array<{
    itemId: string;
    quantity: number;
    price: number;
    marketId: string;
    timestamp: number;
    type: 'buy' | 'sell';
  }> = [];
  
  // Business operations
  public supplychains: string[] = [];             // Owned supply chains
  public territory: string[] = [];                // Controlled territories
  public protection: Record<string, number> = {}; // Protection payments
  
  constructor(entityId: EntityId) {
    super(entityId);
  }
  
  // Add transaction to history
  addTransaction(itemId: string, quantity: number, price: number, marketId: string, type: 'buy' | 'sell'): void {
    this.transactions.push({
      itemId,
      quantity,
      price,
      marketId,
      timestamp: Date.now(),
      type
    });
    
    // Keep only recent transactions
    if (this.transactions.length > 50) {
      this.transactions = this.transactions.slice(-50);
    }
  }
  
  // Get market reputation
  getMarketReputation(marketId: string): number {
    return this.reputation[marketId] || 0;
  }
  
  // Modify market reputation
  modifyMarketReputation(marketId: string, change: number): void {
    this.reputation[marketId] = Math.max(-100, Math.min(100, 
      (this.reputation[marketId] || 0) + change));
  }
}

// Economy system managing the underground markets
export class UndergroundEconomy extends System {
  private markets: Map<string, BlackMarket> = new Map();
  private items: Map<string, MarketItem> = new Map();
  private routes: Map<string, TradingRoute> = new Map();
  private supplyChains: Map<string, SupplyChain> = new Map();
  
  private lastPriceUpdate = 0;
  private priceUpdateInterval = 300000; // Update prices every 5 minutes
  
  constructor() {
    super();
    this.initializeMarkets();
    this.initializeItems();
    this.initializeRoutes();
  }
  
  update(deltaTime: number): void {
    const now = Date.now();
    
    // Update market prices periodically
    if (now - this.lastPriceUpdate > this.priceUpdateInterval) {
      this.updateMarketPrices();
      this.updateSupplyDemand();
      this.processSupplyChains();
      this.lastPriceUpdate = now;
    }
    
    // Update route heat based on usage
    this.updateRouteHeat();
    
    // Process market events
    this.processMarketEvents();
  }
  
  // Initialize black markets
  private initializeMarkets(): void {
    const markets: BlackMarket[] = [
      {
        id: 'street_corner_1',
        name: 'Rautatientori',
        location: 'downtown',
        type: 'street_corner',
        securityLevel: 20,
        discretion: 30,
        reputation: 40,
        itemCategories: ['drugs', 'stolen_goods'],
        services: ['information'],
        priceModifier: 1.0,
        qualityModifier: 0.8,
        protectedBy: 'street_gangs'
      },
      {
        id: 'warehouse_market',
        name: 'Sataman Varasto',
        location: 'docks',
        type: 'warehouse',
        securityLevel: 70,
        discretion: 80,
        reputation: 75,
        itemCategories: ['drugs', 'weapons', 'contraband'],
        services: ['money_laundering', 'storage'],
        entryRequirements: {
          reputation: { 'organized_crime': 30 },
          introduction: true
        },
        priceModifier: 0.9,
        qualityModifier: 1.2,
        protectedBy: 'organized_crime'
      },
      {
        id: 'nightclub_vip',
        name: 'Kulta-Kultala VIP',
        location: 'uptown',
        type: 'nightclub',
        securityLevel: 60,
        discretion: 90,
        reputation: 85,
        itemCategories: ['drugs', 'services', 'information'],
        services: ['high_end_services', 'connections'],
        entryRequirements: {
          reputation: { 'high_society': 40 },
          paymentUpfront: 100
        },
        priceModifier: 1.5,
        qualityModifier: 1.4,
        protectedBy: 'high_society'
      },
      {
        id: 'mobile_dealer',
        name: 'Liikkuva Kauppias',
        location: 'mobile',
        type: 'mobile',
        securityLevel: 40,
        discretion: 60,
        reputation: 50,
        itemCategories: ['drugs', 'weapons'],
        services: ['delivery'],
        priceModifier: 1.2,
        qualityModifier: 0.9
      }
    ];
    
    markets.forEach(market => this.markets.set(market.id, market));
  }
  
  // Initialize market items
  private initializeItems(): void {
    const items: MarketItem[] = [
      {
        id: 'cannabis_premium',
        name: 'Premium Kannabis',
        category: 'drugs',
        basePrice: 25,
        currentPrice: 25,
        supply: 50,
        demand: 60,
        heat: 30,
        quality: 80,
        rarity: 40,
        suppliers: ['drug_chemist', 'smuggler'],
        routes: ['northern_route', 'sea_route'],
        priceHistory: [],
        demandHistory: []
      },
      {
        id: 'stolen_electronics',
        name: 'Varastettu Elektroniikka',
        category: 'stolen_goods',
        basePrice: 200,
        currentPrice: 200,
        supply: 30,
        demand: 40,
        heat: 50,
        quality: 70,
        rarity: 60,
        suppliers: ['street_thief', 'burglar'],
        routes: ['city_route'],
        priceHistory: [],
        demandHistory: []
      },
      {
        id: 'synthetic_drugs',
        name: 'Synteettinen Huume',
        category: 'drugs',
        basePrice: 80,
        currentPrice: 80,
        supply: 20,
        demand: 70,
        heat: 70,
        quality: 90,
        rarity: 80,
        minReputation: { 'drug_networks': 25 },
        suppliers: ['drug_chemist'],
        routes: ['lab_route'],
        priceHistory: [],
        demandHistory: []
      },
      {
        id: 'information_police',
        name: 'Poliisi-informaatio',
        category: 'information',
        basePrice: 500,
        currentPrice: 500,
        supply: 10,
        demand: 80,
        heat: 90,
        quality: 95,
        rarity: 95,
        minReputation: { 'police': -20, 'organized_crime': 40 },
        suppliers: ['corrupt_official'],
        routes: ['insider_route'],
        priceHistory: [],
        demandHistory: []
      },
      {
        id: 'protection_service',
        name: 'Suojelupalvelu',
        category: 'services',
        basePrice: 1000,
        currentPrice: 1000,
        supply: 5,
        demand: 90,
        heat: 60,
        quality: 85,
        rarity: 90,
        minReputation: { 'organized_crime': 50 },
        suppliers: ['gang_enforcer', 'gang_leader'],
        routes: ['territory_route'],
        priceHistory: [],
        demandHistory: []
      }
    ];
    
    items.forEach(item => this.items.set(item.id, item));
  }
  
  // Initialize trading routes
  private initializeRoutes(): void {
    const routes: TradingRoute[] = [
      {
        id: 'northern_route',
        name: 'Pohjoisreitti',
        startLocation: 'suburbs',
        endLocation: 'downtown',
        distance: 15,
        risk: 40,
        capacity: 20,
        cost: 50,
        active: true,
        lastUsed: 0,
        heatLevel: 30,
        factionControl: 'street_gangs'
      },
      {
        id: 'sea_route',
        name: 'Merireitti',
        startLocation: 'coast',
        endLocation: 'docks',
        distance: 25,
        risk: 30,
        capacity: 50,
        cost: 200,
        active: true,
        lastUsed: 0,
        heatLevel: 20,
        skillRequirements: { driving: 40 },
        factionControl: 'organized_crime',
        vehicleRequired: 'boat'
      },
      {
        id: 'lab_route',
        name: 'Laboratorioreitti',
        startLocation: 'industrial_area',
        endLocation: 'warehouse_district',
        distance: 10,
        risk: 60,
        capacity: 10,
        cost: 100,
        active: true,
        lastUsed: 0,
        heatLevel: 50,
        skillRequirements: { chemistry: 30, evasion: 25 },
        factionControl: 'drug_networks'
      },
      {
        id: 'insider_route',
        name: 'Sisäpiirin Reitti',
        startLocation: 'government_district',
        endLocation: 'uptown',
        distance: 5,
        risk: 80,
        capacity: 1,
        cost: 1000,
        active: true,
        lastUsed: 0,
        heatLevel: 70,
        skillRequirements: { lying: 60, negotiation: 50 },
        factionControl: 'high_society'
      }
    ];
    
    routes.forEach(route => this.routes.set(route.id, route));
  }
  
  // Update market prices based on supply and demand
  private updateMarketPrices(): void {
    for (const [itemId, item] of this.items) {
      // Calculate price based on supply/demand
      const supplyDemandRatio = item.demand / Math.max(1, item.supply);
      let priceChange = (supplyDemandRatio - 1) * 0.1; // 10% max change per update
      
      // Heat affects prices (higher heat = higher prices)
      priceChange += (item.heat / 100) * 0.05;
      
      // Quality affects prices
      priceChange += ((item.quality - 50) / 100) * 0.03;
      
      // Rarity affects prices
      priceChange += (item.rarity / 100) * 0.02;
      
      // Apply price change with limits
      const newPrice = item.currentPrice * (1 + priceChange);
      item.currentPrice = Math.max(
        item.basePrice * 0.3,  // Min 30% of base price
        Math.min(
          item.basePrice * 3,  // Max 300% of base price
          newPrice
        )
      );
      
      // Record price history
      item.priceHistory.push({
        price: item.currentPrice,
        timestamp: Date.now()
      });
      
      // Keep only recent history
      if (item.priceHistory.length > 100) {
        item.priceHistory = item.priceHistory.slice(-100);
      }
    }
  }
  
  // Update supply and demand based on various factors
  private updateSupplyDemand(): void {
    for (const [itemId, item] of this.items) {
      // Random fluctuations
      item.demand += (Math.random() - 0.5) * 10;
      item.supply += (Math.random() - 0.5) * 5;
      
      // Heat affects supply (higher heat = lower supply)
      item.supply *= 1 - (item.heat / 200);
      
      // Seasonal/event-based demand changes
      if (item.category === 'drugs') {
        // Weekend demand spike
        const dayOfWeek = new Date().getDay();
        if (dayOfWeek === 5 || dayOfWeek === 6) {
          item.demand *= 1.2;
        }
      }
      
      // Clamp values
      item.demand = Math.max(10, Math.min(100, item.demand));
      item.supply = Math.max(1, Math.min(100, item.supply));
    }
  }
  
  // Process supply chain operations
  private processSupplyChains(): void {
    for (const [chainId, chain] of this.supplyChains) {
      if (chain.disrupted) continue;
      
      // Process each node in the chain
      for (const node of chain.nodes) {
        if (!node.operational) continue;
        
        // Production nodes generate items
        if (node.type === 'production' && node.productionRate) {
          const produced = node.productionRate * (chain.efficiency / 100);
          node.currentStock = Math.min(node.capacity, node.currentStock + produced);
        }
        
        // Apply operating costs
        // This would need to be connected to the entity's wallet
      }
    }
  }
  
  // Update route heat based on usage
  private updateRouteHeat(): void {
    for (const [routeId, route] of this.routes) {
      // Heat decays over time if not used
      const timeSinceUse = Date.now() - route.lastUsed;
      const daysSinceUse = timeSinceUse / (1000 * 60 * 60 * 24);
      
      if (daysSinceUse > 1) {
        route.heatLevel = Math.max(0, route.heatLevel - daysSinceUse * 2);
      }
    }
  }
  
  // Process random market events
  private processMarketEvents(): void {
    // Police raids
    if (Math.random() < 0.001) { // 0.1% chance per update
      this.processPoliceRaid();
    }
    
    // Supply disruptions
    if (Math.random() < 0.002) { // 0.2% chance per update
      this.processSupplyDisruption();
    }
    
    // New market opportunities
    if (Math.random() < 0.0005) { // 0.05% chance per update
      this.createMarketOpportunity();
    }
  }
  
  // Process a police raid on a market
  private processPoliceRaid(): void {
    const marketIds = Array.from(this.markets.keys());
    const targetId = marketIds[Math.floor(Math.random() * marketIds.length)];
    const market = this.markets.get(targetId);
    
    if (!market) return;
    
    // Raid success based on security and heat
    const raidChance = Math.max(0.1, 1 - (market.securityLevel / 100));
    
    if (Math.random() < raidChance) {
      // Successful raid
      market.lastRaid = Date.now();
      market.reputation -= 20;
      
      // Affect item availability and heat
      for (const itemId of market.itemCategories) {
        const item = Array.from(this.items.values()).find(i => i.category === itemId);
        if (item) {
          item.supply *= 0.7; // Reduce supply
          item.heat += 15;    // Increase heat
        }
      }
    }
  }
  
  // Process supply chain disruption
  private processSupplyDisruption(): void {
    const chainIds = Array.from(this.supplyChains.keys());
    if (chainIds.length === 0) return;
    
    const targetId = chainIds[Math.floor(Math.random() * chainIds.length)];
    const chain = this.supplyChains.get(targetId);
    
    if (chain && !chain.disrupted) {
      chain.disrupted = true;
      chain.efficiency *= 0.5;
      
      // Affect related item supply
      const item = this.items.get(chain.itemId);
      if (item) {
        item.supply *= 0.6;
        item.heat += 10;
      }
      
      // Auto-recover after some time
      setTimeout(() => {
        chain.disrupted = false;
        chain.efficiency = Math.min(100, chain.efficiency * 1.5);
      }, 300000); // 5 minutes
    }
  }
  
  // Create a new market opportunity
  private createMarketOpportunity(): void {
    // This could create temporary high-demand items or new routes
    const items = Array.from(this.items.values());
    const randomItem = items[Math.floor(Math.random() * items.length)];
    
    // Spike demand for random item
    randomItem.demand = Math.min(100, randomItem.demand + 30);
    
    // Create temporary price bonus
    setTimeout(() => {
      randomItem.demand = Math.max(10, randomItem.demand - 20);
    }, 600000); // 10 minutes
  }
  
  // Get available markets for a player
  getAvailableMarkets(playerId: EntityId, socialProfile: SocialProfile): BlackMarket[] {
    const available: BlackMarket[] = [];
    
    for (const [marketId, market] of this.markets) {
      let canAccess = true;
      
      // Check entry requirements
      if (market.entryRequirements) {
        if (market.entryRequirements.reputation) {
          for (const [faction, required] of Object.entries(market.entryRequirements.reputation)) {
            const rep = socialProfile.getFactionReputation(faction);
            if (!rep || rep.reputation < required) {
              canAccess = false;
              break;
            }
          }
        }
      }
      
      if (canAccess) {
        available.push(market);
      }
    }
    
    return available;
  }
  
  // Get items available at a specific market
  getMarketInventory(marketId: string): MarketItem[] {
    const market = this.markets.get(marketId);
    if (!market) return [];
    
    return Array.from(this.items.values()).filter(item =>
      market.itemCategories.includes(item.category) && item.supply > 0
    );
  }
  
  // Calculate final price for an item at a specific market
  calculatePrice(itemId: string, marketId: string, quantity: number = 1, playerRep: number = 0): number {
    const item = this.items.get(itemId);
    const market = this.markets.get(marketId);
    
    if (!item || !market) return 0;
    
    let finalPrice = item.currentPrice * quantity;
    
    // Apply market modifier
    finalPrice *= market.priceModifier;
    
    // Reputation discount (max 20% discount for high rep)
    const repDiscount = Math.min(0.2, Math.max(0, playerRep / 500));
    finalPrice *= (1 - repDiscount);
    
    // Bulk discount for large quantities
    if (quantity >= 10) {
      finalPrice *= 0.95;
    }
    if (quantity >= 50) {
      finalPrice *= 0.9;
    }
    
    return Math.round(finalPrice);
  }
  
  // Execute a trade transaction
  executeTrade(playerId: EntityId, marketId: string, itemId: string, quantity: number, type: 'buy' | 'sell'): boolean {
    const item = this.items.get(itemId);
    const market = this.markets.get(marketId);
    const participant = this.componentManager.getComponent(playerId, MarketParticipant);
    
    if (!item || !market || !participant) return false;
    
    if (type === 'buy') {
      if (item.supply < quantity) return false;
      
      item.supply -= quantity;
      item.demand = Math.min(100, item.demand + quantity * 0.1);
      
      // Add to participant's inventory
      const currentStock = participant.inventory.get(itemId) || 0;
      participant.inventory.set(itemId, currentStock + quantity);
      
    } else { // sell
      const currentStock = participant.inventory.get(itemId) || 0;
      if (currentStock < quantity) return false;
      
      item.supply = Math.min(100, item.supply + quantity);
      item.demand = Math.max(10, item.demand - quantity * 0.1);
      
      // Remove from participant's inventory
      participant.inventory.set(itemId, currentStock - quantity);
    }
    
    // Record transaction
    const price = this.calculatePrice(itemId, marketId, quantity, participant.getMarketReputation(marketId));
    participant.addTransaction(itemId, quantity, price, marketId, type);
    
    // Update market reputation slightly
    participant.modifyMarketReputation(marketId, type === 'buy' ? 1 : 2);
    
    return true;
  }
  
  // Get market intelligence (information about prices, supply, etc.)
  getMarketIntelligence(marketId: string, intelligenceLevel: number = 50): any {
    const market = this.markets.get(marketId);
    if (!market) return null;
    
    const inventory = this.getMarketInventory(marketId);
    const intelligence: any = {
      marketName: market.name,
      reputation: market.reputation,
      lastRaid: market.lastRaid,
      items: []
    };
    
    for (const item of inventory) {
      const itemInfo: any = {
        id: item.id,
        name: item.name,
        currentPrice: item.currentPrice
      };
      
      // Higher intelligence reveals more information
      if (intelligenceLevel > 30) {
        itemInfo.supply = item.supply;
        itemInfo.demand = item.demand;
      }
      
      if (intelligenceLevel > 60) {
        itemInfo.heat = item.heat;
        itemInfo.quality = item.quality;
        itemInfo.priceHistory = item.priceHistory.slice(-10);
      }
      
      if (intelligenceLevel > 80) {
        itemInfo.suppliers = item.suppliers;
        itemInfo.routes = item.routes;
      }
      
      intelligence.items.push(itemInfo);
    }
    
    return intelligence;
  }
}

// Utility functions for economy management
export function calculateProfitMargin(buyPrice: number, sellPrice: number, costs: number = 0): number {
  return ((sellPrice - buyPrice - costs) / buyPrice) * 100;
}

export function getOptimalTradingRoute(startLocation: string, endLocation: string, routes: TradingRoute[]): TradingRoute | null {
  const validRoutes = routes.filter(route => 
    route.startLocation === startLocation && 
    route.endLocation === endLocation && 
    route.active
  );
  
  if (validRoutes.length === 0) return null;
  
  // Find route with best risk/cost ratio
  return validRoutes.reduce((best, current) => {
    const currentScore = current.capacity / (current.risk + current.cost / 10);
    const bestScore = best.capacity / (best.risk + best.cost / 10);
    return currentScore > bestScore ? current : best;
  });
}

export function estimateMarketValue(items: Map<string, number>, marketPrices: Map<string, number>): number {
  let totalValue = 0;
  
  for (const [itemId, quantity] of items) {
    const price = marketPrices.get(itemId) || 0;
    totalValue += price * quantity;
  }
  
  return totalValue;
}