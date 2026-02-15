/**
 * Represents a Minecraft text component which can be a plain string, number, an object with various styling and interaction options, or an array of these elements.
 */
export type TextComponent =
  | number
  | string
  | Component
  | (number | string | Component)[];

export interface Component {
  text?: string;
  translate?: string;
  with?: (number | string | Component)[];
  extra?: (number | string | Component)[];
  color?:
    | `#${string}`
    | "black"
    | "dark_blue"
    | "dark_green"
    | "dark_aqua"
    | "dark_red"
    | "dark_purple"
    | "gold"
    | "gray"
    | "dark_gray"
    | "blue"
    | "green"
    | "aqua"
    | "red"
    | "light_purple"
    | "yellow"
    | "white";
  bold?: boolean;
  italic?: boolean;
  underlined?: boolean;
  strikethrough?: boolean;
  obfuscated?: boolean;
  insertion?: string;
  hover_event?: HoverEvent;
  click_event?: ClickEvent;
}

export type HoverEvent =
  | ShowTextHoverEvent
  | ShowItemHoverEvent
  | ShowEntityHoverEvent;

export interface ShowTextHoverEvent {
  action: "show_text";
  contents?: number | string | Component | (number | string | Component)[];
  value?: number | string | Component | (number | string | Component)[];
}

export interface ShowItemHoverEvent {
  action: "show_item";
  id: string;
  count?: number;
  tag?: string;
}

export interface ShowEntityHoverEvent {
  action: "show_entity";
  id: string;
  name?: string | Component;
}

export type ClickEvent =
  | OpenUrlClickEvent
  | OpenFileClickEvent
  | RunCommandClickEvent
  | SuggestCommandClickEvent
  | ChangePageClickEvent
  | CopyToClipboardClickEvent
  | ShowDialogClickEvent
  | CustomClickEvent;

export interface OpenUrlClickEvent {
  action: "open_url";
  url: string;
}

export interface OpenFileClickEvent {
  action: "open_file";
  path: string;
}

export interface RunCommandClickEvent {
  action: "run_command";
  command: string;
}

export interface SuggestCommandClickEvent {
  action: "suggest_command";
  command: string;
}

export interface ChangePageClickEvent {
  action: "change_page";
  page: number;
}

export interface CopyToClipboardClickEvent {
  action: "copy_to_clipboard";
  value: string;
}

export interface ShowDialogClickEvent {
  action: "show_dialog";
  dialog: unknown;
}

export interface CustomClickEvent {
  action: "custom";
  id: string;
  payload?: unknown;
}
