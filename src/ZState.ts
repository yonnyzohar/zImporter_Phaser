import { ZContainer } from "./ZContainer";
import { ZTimeline } from "./ZTimeline";

//in a state, all children are turned off at any given moment except one
/**
 * Represents a stateful container that manages its child containers as states.
 * Extends the `ZContainer` class and provides methods to initialize, query, and switch between states.
 *
 * Each state is represented by a child container, and only the current state is visible at any time.
 * If the desired state is not found, it falls back to the "idle" state or the first child.
 *
 * Methods:
 * - `init()`: Initializes the state container by setting the current state to "idle".
 * - `getCurrentState()`: Returns the currently active state container or `null` if none is set.
 * - `hasState(str: string)`: Checks if a child state with the given name exists.
 * - `setState(str: string)`: Sets the current state to the child with the given name, hiding all others.
 *    If the state is a `ZTimeline`, it will be played or stopped accordingly.
 */
export class ZState extends ZContainer{
    
    protected currentState:ZContainer | null = null;
    //this is called once all children of the container are loaded
    public init():void{
        this.setState("idle");
    }

    public getCurrentState():ZContainer | null
    {
        return this.currentState;
    }

    public hasState(str:string):boolean
    {
        return this.getChildByName(str) !== null;
    }

    public getAllStateNames() {
        return this.children.map((child) => child.name);
    }

    public setState(str:string):ZContainer | null
    {
        let chosenChild:ZContainer = this.getChildByName(str) as ZContainer;
        if(!chosenChild)
        {
            chosenChild = this.getChildByName("idle") as ZContainer;
            if(!chosenChild)
            {
                chosenChild = this.getChildAt(0) as ZContainer;
            }
        }
        for(let i = 0; i < this.children.length; i++)
        {
            let child = this.children[i];
            child.visible = false;
            if(child instanceof ZTimeline)
            {
                let t = child as ZTimeline;
                t.stop();
            }
        }
        if(chosenChild)
        {
            chosenChild.visible = true;
            if(chosenChild instanceof ZTimeline)
            {
                let t = chosenChild as ZTimeline;
                t.play();
            }
        }
        this.currentState = chosenChild;
        chosenChild.parent.addChild(chosenChild);
        return chosenChild;
    }
}