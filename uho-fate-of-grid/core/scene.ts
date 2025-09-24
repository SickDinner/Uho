import { tweenManager, Tween, Easing, AnimationUtils } from './animation.ts';
import type { EasingFunction } from './animation.ts';

export interface SceneTransition {
  type: 'fade' | 'slide' | 'scale' | 'wipe' | 'none';
  duration: number;
  easing?: EasingFunction;
  direction?: 'left' | 'right' | 'up' | 'down';
}

export abstract class Scene {
  public name: string;
  public active: boolean = false;
  public visible: boolean = true;
  public opacity: number = 1;
  public scale: number = 1;
  public x: number = 0;
  public y: number = 0;
  
  // Transition properties
  public transitionState: 'none' | 'entering' | 'exiting' = 'none';
  private transitionTween?: Tween;
  
  constructor(name: string) {
    this.name = name;
  }
  
  // Lifecycle methods to be implemented by subclasses
  abstract onEnter(): void;
  abstract onExit(): void;
  abstract update(deltaTime: number): void;
  abstract render(ctx: CanvasRenderingContext2D): void;
  
  // Optional lifecycle methods
  onPause(): void {}
  onResume(): void {}
  
  // Handle input (return true if consumed, false to pass through)
  handleInput(keys: Set<string>): boolean {
    return false;
  }
  
  // Transition methods
  startEnterTransition(transition: SceneTransition, onComplete?: () => void): void {
    this.transitionState = 'entering';
    this.applyTransition(transition, true, () => {
      this.transitionState = 'none';
      if (onComplete) onComplete();
    });
  }
  
  startExitTransition(transition: SceneTransition, onComplete?: () => void): void {
    this.transitionState = 'exiting';
    this.applyTransition(transition, false, () => {
      this.transitionState = 'none';
      if (onComplete) onComplete();
    });
  }
  
  private applyTransition(transition: SceneTransition, entering: boolean, onComplete?: () => void): void {
    if (this.transitionTween) {
      this.transitionTween.stop();
    }
    
    const easing = transition.easing || Easing.quadOut;
    
    switch (transition.type) {
      case 'fade':
        this.applyFadeTransition(transition.duration, entering, easing, onComplete);
        break;
      case 'slide':
        this.applySlideTransition(transition.duration, transition.direction || 'right', entering, easing, onComplete);
        break;
      case 'scale':
        this.applyScaleTransition(transition.duration, entering, easing, onComplete);
        break;
      case 'wipe':
        this.applyWipeTransition(transition.duration, transition.direction || 'right', entering, easing, onComplete);
        break;
      case 'none':
        if (onComplete) onComplete();
        break;
    }
  }
  
  private applyFadeTransition(duration: number, entering: boolean, easing: EasingFunction, onComplete?: () => void): void {
    const fromOpacity = entering ? 0 : this.opacity;
    const toOpacity = entering ? 1 : 0;
    
    this.opacity = fromOpacity;
    
    this.transitionTween = new Tween({
      from: fromOpacity,
      to: toOpacity,
      duration,
      easing,
      onUpdate: (value) => {
        this.opacity = value;
      },
      ...(onComplete && { onComplete })
    });
    
    tweenManager.add(this.transitionTween);
    this.transitionTween.start();
  }
  
  private applySlideTransition(duration: number, direction: string, entering: boolean, easing: EasingFunction, onComplete?: () => void): void {
    const canvasWidth = 800; // Should get from config
    const canvasHeight = 600;
    
    let fromX = this.x;
    let fromY = this.y;
    let toX = 0;
    let toY = 0;
    
    if (entering) {
      // Slide in from off-screen
      switch (direction) {
        case 'left':
          fromX = -canvasWidth;
          break;
        case 'right':
          fromX = canvasWidth;
          break;
        case 'up':
          fromY = -canvasHeight;
          break;
        case 'down':
          fromY = canvasHeight;
          break;
      }
    } else {
      // Slide out to off-screen
      switch (direction) {
        case 'left':
          toX = -canvasWidth;
          break;
        case 'right':
          toX = canvasWidth;
          break;
        case 'up':
          toY = -canvasHeight;
          break;
        case 'down':
          toY = canvasHeight;
          break;
      }
    }
    
    this.x = fromX;
    this.y = fromY;
    
    const slideX = new Tween({
      from: fromX,
      to: toX,
      duration,
      easing,
      onUpdate: (value) => {
        this.x = value;
      }
    });
    
    const slideY = new Tween({
      from: fromY,
      to: toY,
      duration,
      easing,
      onUpdate: (value) => {
        this.y = value;
      },
      ...(onComplete && { onComplete })
    });
    
    tweenManager.add(slideX);
    tweenManager.add(slideY);
    slideX.start();
    slideY.start();
    
    this.transitionTween = slideX; // Store one for cleanup
  }
  
  private applyScaleTransition(duration: number, entering: boolean, easing: EasingFunction, onComplete?: () => void): void {
    const fromScale = entering ? 0 : this.scale;
    const toScale = entering ? 1 : 0;
    
    this.scale = fromScale;
    
    this.transitionTween = new Tween({
      from: fromScale,
      to: toScale,
      duration,
      easing,
      onUpdate: (value) => {
        this.scale = value;
      },
      ...(onComplete && { onComplete })
    });
    
    tweenManager.add(this.transitionTween);
    this.transitionTween.start();
  }
  
  private applyWipeTransition(duration: number, direction: string, entering: boolean, easing: EasingFunction, onComplete?: () => void): void {
    // This would require a custom render implementation with clipping
    // For now, fall back to slide
    this.applySlideTransition(duration, direction, entering, easing, onComplete);
  }
  
  // Cleanup
  destroy(): void {
    if (this.transitionTween) {
      this.transitionTween.stop();
    }
  }
}

export class SceneManager {
  private scenes: Map<string, Scene> = new Map();
  private sceneStack: Scene[] = [];
  private currentScene?: Scene;
  private nextScene?: Scene;
  private isTransitioning: boolean = false;
  
  // Default transitions
  public defaultEnterTransition: SceneTransition = {
    type: 'fade',
    duration: 300,
    easing: Easing.quadOut
  };
  
  public defaultExitTransition: SceneTransition = {
    type: 'fade',
    duration: 300,
    easing: Easing.quadIn
  };
  
  addScene(scene: Scene): void {
    this.scenes.set(scene.name, scene);
  }
  
  removeScene(name: string): void {
    const scene = this.scenes.get(name);
    if (scene) {
      scene.destroy();
      this.scenes.delete(name);
    }
  }
  
  getScene(name: string): Scene | undefined {
    return this.scenes.get(name);
  }
  
  getCurrentScene(): Scene | undefined {
    return this.currentScene;
  }
  
  // Change to a different scene
  changeScene(
    sceneName: string,
    exitTransition?: SceneTransition,
    enterTransition?: SceneTransition
  ): void {
    const newScene = this.scenes.get(sceneName);
    if (!newScene) {
      console.error(`Scene '${sceneName}' not found`);
      return;
    }
    
    if (this.isTransitioning) {
      console.warn('Already transitioning between scenes');
      return;
    }
    
    this.nextScene = newScene;
    this.isTransitioning = true;
    
    const actualExitTransition = exitTransition || this.defaultExitTransition;
    const actualEnterTransition = enterTransition || this.defaultEnterTransition;
    
    if (this.currentScene) {
      // Exit current scene
      this.currentScene.onExit();
      this.currentScene.startExitTransition(actualExitTransition, () => {
        this.completeSceneTransition(actualEnterTransition);
      });
    } else {
      // No current scene, directly enter new scene
      this.completeSceneTransition(actualEnterTransition);
    }
  }
  
  private completeSceneTransition(enterTransition: SceneTransition): void {
    if (this.currentScene) {
      this.currentScene.active = false;
      this.currentScene.visible = false;
    }
    
    this.currentScene = this.nextScene!;
    this.currentScene.active = true;
    this.currentScene.visible = true;
    this.currentScene.onEnter();
    
    this.currentScene.startEnterTransition(enterTransition, () => {
      this.isTransitioning = false;
      this.nextScene = undefined;
    });
  }
  
  // Push a scene onto the stack (overlay)
  pushScene(
    sceneName: string,
    enterTransition?: SceneTransition
  ): void {
    const scene = this.scenes.get(sceneName);
    if (!scene) {
      console.error(`Scene '${sceneName}' not found`);
      return;
    }
    
    if (this.currentScene) {
      this.currentScene.onPause();
      this.sceneStack.push(this.currentScene);
    }
    
    this.currentScene = scene;
    scene.active = true;
    scene.visible = true;
    scene.onEnter();
    
    const actualTransition = enterTransition || this.defaultEnterTransition;
    scene.startEnterTransition(actualTransition);
  }
  
  // Pop the current scene from the stack
  popScene(exitTransition?: SceneTransition): void {
    if (!this.currentScene || this.sceneStack.length === 0) {
      console.warn('No scene to pop');
      return;
    }
    
    const actualTransition = exitTransition || this.defaultExitTransition;
    
    this.currentScene.onExit();
    this.currentScene.startExitTransition(actualTransition, () => {
      this.currentScene!.active = false;
      this.currentScene!.visible = false;
      
      this.currentScene = this.sceneStack.pop()!;
      this.currentScene.active = true;
      this.currentScene.visible = true;
      this.currentScene.onResume();
    });
  }
  
  update(deltaTime: number): void {
    // Update all visible scenes (for overlay effects)
    for (const scene of this.sceneStack) {
      if (scene.visible) {
        scene.update(deltaTime);
      }
    }
    
    if (this.currentScene && this.currentScene.visible) {
      this.currentScene.update(deltaTime);
    }
  }
  
  render(ctx: CanvasRenderingContext2D): void {
    // Render scenes from bottom to top
    for (const scene of this.sceneStack) {
      if (scene.visible) {
        this.renderScene(ctx, scene);
      }
    }
    
    if (this.currentScene && this.currentScene.visible) {
      this.renderScene(ctx, this.currentScene);
    }
  }
  
  private renderScene(ctx: CanvasRenderingContext2D, scene: Scene): void {
    ctx.save();
    
    // Apply scene transformations
    ctx.globalAlpha = scene.opacity;
    ctx.translate(scene.x, scene.y);
    ctx.scale(scene.scale, scene.scale);
    
    scene.render(ctx);
    
    ctx.restore();
  }
  
  handleInput(keys: Set<string>): boolean {
    // Handle input from top scene down
    if (this.currentScene && this.currentScene.active) {
      if (this.currentScene.handleInput(keys)) {
        return true; // Input consumed
      }
    }
    
    // Check stacked scenes (in reverse order)
    for (let i = this.sceneStack.length - 1; i >= 0; i--) {
      const scene = this.sceneStack[i];
      if (scene.active && scene.handleInput(keys)) {
        return true; // Input consumed
      }
    }
    
    return false; // Input not consumed
  }
  
  // Utility methods for common scene transitions
  fadeToScene(sceneName: string, duration: number = 300): void {
    this.changeScene(sceneName, 
      { type: 'fade', duration, easing: Easing.quadIn },
      { type: 'fade', duration, easing: Easing.quadOut }
    );
  }
  
  slideToScene(sceneName: string, direction: 'left' | 'right' | 'up' | 'down', duration: number = 400): void {
    this.changeScene(sceneName,
      { type: 'slide', duration, direction, easing: Easing.quadInOut },
      { type: 'slide', duration, direction, easing: Easing.quadInOut }
    );
  }
  
  scaleToScene(sceneName: string, duration: number = 300): void {
    this.changeScene(sceneName,
      { type: 'scale', duration, easing: Easing.quadIn },
      { type: 'scale', duration, easing: Easing.elasticOut }
    );
  }
  
  // Clean up all scenes
  destroy(): void {
    for (const scene of this.scenes.values()) {
      scene.destroy();
    }
    this.scenes.clear();
    this.sceneStack.length = 0;
    this.currentScene = undefined;
    this.nextScene = undefined;
  }
}

// Create global scene manager instance
export const sceneManager = new SceneManager();