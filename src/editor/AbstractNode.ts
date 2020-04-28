import { IDocNode, DocType, CaptureCallback, BubbleCallback } from "./types";
import { isPartialShallowEqual, assert, getAbstractNodePath } from "./utils";
import { AbstractIntent } from "./AbstractIntent";
import { AbstractEvent } from "./AbstractEvent";

export type AbstractData<T extends IDocNode> = Omit<T, 'type' | 'id' | 'childNodes'>;

export class AbstractNode<T extends IDocNode = any> {
  readonly type: DocType;
  readonly id: string;

  // render view
  data: AbstractData<T>;
  render?(data: AbstractData<T>): void;
  // render children
  abstractNodes?: AbstractNode[];
  renderAbstractNodes?(abstractNodes?: AbstractNode[]): void;

  // intent hook
  onViewIntent?(abstractIntent: AbstractIntent, originEvent?: Event): void | BubbleCallback;

  constructor(
    { type, id, childNodes, ...rest }: IDocNode,
    public parent: AbstractNode | null,
  ) {
    this.type = type;
    this.id = id;
    this.data = rest as any;
    this.abstractNodes = childNodes?.map(node => new AbstractNode(node, this));
  }

  update(partialData: Partial<AbstractData<T>>) {
    if (isPartialShallowEqual(partialData, this.data)) {
      return;
    }
    this.data = Object.assign({}, this.data, partialData);
    if (this.render) {
      this.render(this.data);
    }
  }

  concat(...items: AbstractNode[]): AbstractNode[] {
    if (items.length) {
      this.abstractNodes = this.abstractNodes ? this.abstractNodes.concat(...items) : items;
      if (this.renderAbstractNodes) {
        this.renderAbstractNodes(this.abstractNodes);
      }
    }
    return this.abstractNodes || [];
  }

  indexOf(searchElement: AbstractNode): number {
    return this.abstractNodes ? this.abstractNodes.indexOf(searchElement) : -1;
  }

  splice(start: number, deleteCount?: number): AbstractNode[];
  splice(start: number, deleteCount: number, ...items: AbstractNode[]): AbstractNode[];
  splice(start: number, deleteCount?: number, ...items: AbstractNode[]): AbstractNode[] {
    assert(this.abstractNodes);
    let ret: AbstractNode[];
    this.abstractNodes = this.abstractNodes.slice();
    if (deleteCount == null) {
      ret = this.abstractNodes.splice(start);
    } else {
      ret = this.abstractNodes.splice(start, deleteCount, ...items);
    }

    if (this.renderAbstractNodes) {
      this.renderAbstractNodes(this.abstractNodes);
    }
    return ret;
  }

  /**
   * [   a   b   c   d   e   ]
   * 
   * ### example 1
   * replace: [a] -> [X]
   * replace([X], a, a)
   * 
   * ### example 2
   * replace: [b, c, d] -> [X1, X2]
   * replace([X1, X2], b, d)
   * 
   * ### example 2
   * replace: [b, c, d, e] -> [X1, X2]
   * replace([X1, X2], b, e)
   */
  replace(candidates: AbstractNode[], from: AbstractNode, to: AbstractNode): AbstractNode[] {
    assert(this.abstractNodes);
    let fromIndex = this.abstractNodes.indexOf(from);
    let toIndex = from === to ? fromIndex : this.abstractNodes.indexOf(to);

    if (toIndex < fromIndex) {
      [fromIndex, toIndex] = [toIndex, fromIndex];
    }
    assert(fromIndex !== -1 && toIndex !== -1);

    const copy = this.abstractNodes.slice();
    const ret = copy.splice(fromIndex, toIndex - fromIndex + 1, ...candidates);

    this.abstractNodes = copy.length ? copy : undefined;
    if (this.renderAbstractNodes) {
      this.renderAbstractNodes(this.abstractNodes);
    }
    return ret;
  }

  detach() {
    assert(this.parent);
    this.parent.replace([], this, this);
  }
}

export function traverseAbstractNodesRecursively<T extends AbstractEvent>(
  captureCallback: CaptureCallback<T>,
  event: T,
  node: AbstractNode,
  forward: boolean,
  depth: number,
  boundary1?: AbstractNode[],
  boundary2?: AbstractNode[],
) {
  event.depth = depth;
  const currentIndex = event.index;

  const bubbleCallback = captureCallback(node, event);
  const { abstractNodes } = node;
  
  if (event.propagating && !event.bailed && abstractNodes) {
    const nextDepth = depth + 1;
    const node1 = boundary1 && nextDepth < boundary1.length && boundary1[nextDepth];
    const node2 = boundary2 && nextDepth < boundary2.length && boundary2[nextDepth];

    if (node1 && node1 === node2) {
      event.index = -2;
      traverseAbstractNodesRecursively(
        captureCallback,
        event,
        node1,
        forward,
        nextDepth,
        boundary1,
        boundary2,
      );
    } else {
      const start = node1
        ? abstractNodes.indexOf(node1)
        : forward ? 0 : abstractNodes.length - 1;
      assert(start !== -1);

      const end = node2
        ? (forward ? abstractNodes.indexOf(node2, start) : abstractNodes.lastIndexOf(node2, start))
        : forward ? abstractNodes.length - 1 : 0;
      assert(end !== -1);
  
      for (
        let i = start;
        !event.bailed && (forward ? i <= end : i >= end);
        i = forward ? i + 1 : i - 1
      ) {
        const node = abstractNodes[i];
        if (node.parent) {
          event.index = i;
          traverseAbstractNodesRecursively(
            captureCallback,
            event,
            abstractNodes[i],
            forward,
            nextDepth,
            i === start ? boundary1 : undefined,
            i === end ? boundary2 : undefined,
          );
        }
      }
    }
  }

  event.depth = depth;
  event.index = currentIndex;
  if (bubbleCallback) {
    bubbleCallback();
  }
  event.propagating = true;
}

export function traverseAbstractNodes<T extends AbstractEvent = AbstractEvent>(
  captureCallback: CaptureCallback<T>,
  origin: AbstractNode,
  event: T,
  arg1?: AbstractNode[] | AbstractNode,
  arg2?: AbstractNode[] | AbstractNode,
) {
  const boundary1 = Array.isArray(arg1) ? arg1 : arg1 && getAbstractNodePath(arg1, origin);
  const boundary2 = Array.isArray(arg2) ? arg2 : (
    arg1 === arg2 ? boundary1 : arg2 && getAbstractNodePath(arg2, origin)
  );
  assert(
    (!boundary1 || boundary1[0] === origin) &&
    (!boundary2 || boundary2[0] === origin)
  );
  event.boundary1 = boundary1;
  event.boundary2 = boundary2;

  traverseAbstractNodesRecursively(
    captureCallback,
    event,
    origin,
    event.forward,
    0,
    boundary1,
    boundary2,
  );
}
