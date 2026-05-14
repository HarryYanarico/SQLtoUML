import { createContext, useContext } from 'react'

interface EdgeLabelContextValue {
  updateLabel: (edgeId: string, label: string) => void
  updateMultiplicity: (edgeId: string, field: 'sourceMultiplicity' | 'targetMultiplicity', value: string) => void
}

const EdgeLabelContext = createContext<EdgeLabelContextValue>({
  updateLabel: () => {},
  updateMultiplicity: () => {}
})

export function useEdgeLabelContext() {
  return useContext(EdgeLabelContext)
}

export default EdgeLabelContext
