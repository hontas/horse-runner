/// <reference types="vite/client" />

declare const __BUILD_TIME__: string
declare const __COMMIT_HASH__: string

declare module '*.svg?url' {
  const src: string
  export default src
}
