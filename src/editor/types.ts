import { CSSProperties } from "react";
import { AbstractNode, AnyAbstractNode } from "./AbstractNode";
import { AbstractEvent } from "./AbstractEvent";
import { AbstractBaseEvent } from "./AbstractBaseEvent";
import { AbstractRange } from "./AbstractSelection";

export enum DocType {
  Doc,
  List,
  ListItem,
  Paragraph,
  Text,
}

export type Align = 'left' | 'center' | 'right';

export type NonEmptyArray<T> = [T, ...T[]];

// export interface IDocNode {
//   type: Partial<DocType>;
//   id: string;
//   childNodes?: IDocNode[];
// }

// export interface IDocText {
//   type: DocType.Text;
//   id: string;
//   content: string;
//   style?: {
//     fontFamily?: CSSProperties['fontFamily'];
//     fontStyle?: CSSProperties['fontStyle'];
//     fontSize?: CSSProperties['fontSize'];
//     color?: CSSProperties['color'];
//     fontWeight?: CSSProperties['fontWeight'];
//     textDecoration?: CSSProperties['textDecoration'];
//   };
// }

// export interface IDocParagraph {
//   type: DocType.Paragraph;
//   id: string;
//   childNodes: NonEmptyArray<IDocText>;
//   align?: Align;
// }

// export interface IDocListItem {
//   type: DocType.ListItem,
//   id: string;
//   childNodes: NonEmptyArray<IDocParagraph>;
//   order: string;
// }

// export interface IDocList {
//   type: DocType.List;
//   id: string;
//   childNodes: NonEmptyArray<IDocParagraph | IDocList | IDocListItem>;
//   orderList: boolean;
// }

// export interface IDoc {
//   type: DocType.Doc;
//   id: string;
//   childNodes: NonEmptyArray<IDocParagraph | IDocList>;
// }

export interface AbstractDoc extends AbstractNode<DocType.Doc, never> {
  readonly abstractNodes: NonEmptyArray<AbstractList | AbstractParagraph>;
}

export interface AbstractList extends AbstractNode<DocType.List> {
  readonly data: {
    orderList: boolean;
  };
  readonly abstractNodes: NonEmptyArray<AbstractListItem | AbstractParagraph>;
}

export interface AbstractListItem extends AbstractNode<DocType.ListItem> {
  readonly data: {
    order: string;
  };
  readonly abstractNodes: NonEmptyArray<AbstractParagraph>;
}

export interface AbstractParagraph extends AbstractNode<DocType.Paragraph> {
  readonly data?: {
    align: Align;
  };
  readonly abstractNodes: NonEmptyArray<AbstractText>;
}

export interface AbstractText extends AbstractNode<DocType.Text> {
  readonly data: {
    content: string;
    style?: {
      fontFamily?: CSSProperties['fontFamily'];
      fontStyle?: CSSProperties['fontStyle'];
      fontSize?: CSSProperties['fontSize'];
      color?: CSSProperties['color'];
      fontWeight?: CSSProperties['fontWeight'];
      textDecoration?: CSSProperties['textDecoration'];
    };
  };
}

export enum AbstractEventType {
  // Selection
  SelectionSynchronize,
  SelectionRendering,
  SelectionMove,
  SelectionTryMove,
  SelectionBlur,

  // Text
  TextStyle,
  TextDelete,
  TextDeleteBackward,
  ContentReplace,
  TextEnter,
  TextFormatStyle,
  TextQueryStyle,

  // Paragraph
}

export interface SelectionSynchronizePayload {
  isCollapsed: boolean;
  anchorNode: Node;
  anchorOffset: number;
  focusNode: Node;
  focusOffset: number;
  anchorAbstractNode: AnyAbstractNode;
  focusAbstractNode: AnyAbstractNode;
}

export interface SelectionMovePayload {
  forward: boolean;
  shift: boolean;
  step: number;
}

export interface SelectionTryMovePayload {
  step: number;
  forward: boolean;
}

export interface TextQueryStylePayload {
  keys: (keyof NonNullable<AbstractText['data']['style']>)[];
}

export interface RawAbstractEvent<T = any> {
  type: AbstractEventType,
  payload: T;
}

export type AbstractHook = (this: any & { state: never }, abstractEvent: AbstractEvent) => void | BubbleCallback<any>;

export type AbstractHooks = {
  [type in AbstractEventType]?: AbstractHook;
}

export type AbstractBrowserHook = (this: any & { state: any }, abstractEvent: AbstractEvent) => void | BubbleCallback<any>;

export type AbstractBrowserHooks = {
  [type in AbstractEventType]?: AbstractBrowserHook;
}

export type AbstractConfigs = {
  [docType in DocType]: {
    hooks: AbstractHooks,
    browserHooks: AbstractBrowserHooks,
  };
};

export type DocConfigs = {
  [docType in DocType]: {
    readonly View: React.FC<any>;
  }
};

export type EditorConfigs = AbstractConfigs & DocConfigs;

export type BubbleCallback<T> = (this: T) => void;

export type CaptureCallback<T extends AbstractBaseEvent, U> = (this: AnyAbstractNode, abstractEvent: T) => void | BubbleCallback<U>;

export enum AbstractPosition {
  Disconnected,
  Same,
  Preceding,
  Following,
  Contains,
  ContainedBy,
}

export type Writable<T> = {
  -readonly [K in keyof T]: T[K];
};

export interface Reference<T, P = undefined> {
  current: T | P;
}
