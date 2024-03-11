import { Provider, createStore, useAtom } from "jotai"
import { StatusBar } from "./status-bar"
import { isInspectorOpenAtom } from "@/atoms/inspector"
import { Inspector } from "./inspector"
import List from "./list"

const browserStore = createStore()

export function Browser() {
  return (
    <>
      {/* <Provider store={browserStore}> */}
      <div className="flex flex-col h-full w-full flex-auto relative overflow-auto place-items-stretch">
        <div className="flex grow h-full overflow-hidden relative items-stretch">
          {/* <View /> */}
          {/* TODO: have multiple view types */}
          <List />
          <InspectorWrapper />
        </div>
        <StatusBar />
      </div>
      {/* </Provider> */}
    </>
  )
}

function InspectorWrapper() {
  const [showInspector] = useAtom(isInspectorOpenAtom)
  return showInspector ? <Inspector /> : null
}
