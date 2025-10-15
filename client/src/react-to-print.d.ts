declare module 'react-to-print' {
  interface UseReactToPrintOptions {
    content: () => React.RefObject<any> | React.MutableRefObject<any> | null | undefined;
    documentTitle?: string;
    onBeforeGetContent?: () => Promise<any> | void;
    onBeforePrint?: () => Promise<any> | void;
    onAfterPrint?: () => void;
    removeAfterPrint?: boolean;
    print?: (target: HTMLIFrameElement) => Promise<any> | void;
    pageStyle?: string;
  }

  export function useReactToPrint(options: UseReactToPrintOptions): () => void;
}