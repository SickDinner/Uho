import type { EntityId } from './types.ts';

// Base Component class
export abstract class Component {
  constructor(public entityId: EntityId) {}
}

// Entity class
export class Entity {
  private static nextId = 1;
  
  public readonly id: EntityId;
  public active = true;
  
  constructor() {
    this.id = Entity.nextId++;
  }
  
  static resetIds(): void {
    Entity.nextId = 1;
  }
}

// Component Manager
export class ComponentManager {
  private components = new Map<string, Map<EntityId, Component>>();
  
  addComponent<T extends Component>(component: T): void {
    const componentType = component.constructor.name;
    
    if (!this.components.has(componentType)) {
      this.components.set(componentType, new Map());
    }
    
    this.components.get(componentType)!.set(component.entityId, component);
  }
  
  getComponent<T extends Component>(entityId: EntityId, componentClass: new (...args: any[]) => T): T | undefined {
    const componentType = componentClass.name;
    const componentMap = this.components.get(componentType);
    return componentMap?.get(entityId) as T | undefined;
  }
  
  hasComponent<T extends Component>(entityId: EntityId, componentClass: new (...args: any[]) => T): boolean {
    const componentType = componentClass.name;
    const componentMap = this.components.get(componentType);
    return componentMap?.has(entityId) ?? false;
  }
  
  removeComponent<T extends Component>(entityId: EntityId, componentClass: new (...args: any[]) => T): void {
    const componentType = componentClass.name;
    const componentMap = this.components.get(componentType);
    componentMap?.delete(entityId);
  }
  
  getComponentsOfType<T extends Component>(componentClass: new (...args: any[]) => T): T[] {
    const componentType = componentClass.name;
    const componentMap = this.components.get(componentType);
    return componentMap ? Array.from(componentMap.values()) as T[] : [];
  }
  
  removeAllComponents(entityId: EntityId): void {
    for (const componentMap of this.components.values()) {
      componentMap.delete(entityId);
    }
  }
}

// Base System class
export abstract class System {
  constructor(protected componentManager: ComponentManager) {}
  
  abstract update(deltaTime: number): void;
  
  protected getEntitiesWithComponents<T extends Component>(...componentClasses: (new (...args: any[]) => T)[]): EntityId[] {
    if (componentClasses.length === 0) return [];
    
    const firstComponentType = componentClasses[0].name;
    const firstComponentMap = this.componentManager['components'].get(firstComponentType);
    
    if (!firstComponentMap) return [];
    
    const entities: EntityId[] = [];
    
    for (const entityId of firstComponentMap.keys()) {
      let hasAllComponents = true;
      
      for (const componentClass of componentClasses) {
        if (!this.componentManager.hasComponent(entityId, componentClass)) {
          hasAllComponents = false;
          break;
        }
      }
      
      if (hasAllComponents) {
        entities.push(entityId);
      }
    }
    
    return entities;
  }
}

// World class to manage entities and systems
export class World {
  private entities = new Map<EntityId, Entity>();
  private systems: System[] = [];
  
  constructor(public componentManager = new ComponentManager()) {}
  
  createEntity(): Entity {
    const entity = new Entity();
    this.entities.set(entity.id, entity);
    return entity;
  }
  
  removeEntity(entityId: EntityId): void {
    this.entities.delete(entityId);
    this.componentManager.removeAllComponents(entityId);
  }
  
  getEntity(entityId: EntityId): Entity | undefined {
    return this.entities.get(entityId);
  }
  
  addSystem(system: System): void {
    this.systems.push(system);
  }
  
  update(deltaTime: number): void {
    for (const system of this.systems) {
      system.update(deltaTime);
    }
  }
  
  clear(): void {
    this.entities.clear();
    this.systems.length = 0;
    this.componentManager = new ComponentManager();
    Entity.resetIds();
  }
}