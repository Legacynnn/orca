import { describe, expect, it, vi } from 'vitest'

const setTabGroupSplitRatioMock = vi.fn()
const useAppStoreMock = vi.fn(
  (selector: (state: { setTabGroupSplitRatio: () => void }) => unknown) =>
    selector({ setTabGroupSplitRatio: setTabGroupSplitRatioMock })
)
vi.mock('../../store', () => ({
  useAppStore: (selector: (state: { setTabGroupSplitRatio: () => void }) => unknown) =>
    useAppStoreMock(selector)
}))

vi.mock('./TabGroupPanel', () => ({
  default: (props: unknown) => ({ __mock: 'TabGroupPanel', props })
}))

vi.mock('../workspace-canvas-header/WorkspaceCanvasHeader', () => ({
  default: () => null
}))

vi.mock('./useTabDragSplit', () => ({
  useTabDragSplit: () => ({
    activeDrag: null,
    collisionDetection: vi.fn(),
    hoveredDropTarget: null,
    onDragCancel: vi.fn(),
    onDragEnd: vi.fn(),
    onDragMove: vi.fn(),
    onDragOver: vi.fn(),
    onDragStart: vi.fn(),
    sensors: []
  })
}))

import TabGroupSplitLayout from './TabGroupSplitLayout'

describe('TabGroupSplitLayout', () => {
  function getLeafPanelProps(isWorktreeActive: boolean) {
    const element = TabGroupSplitLayout({
      layout: { type: 'leaf', groupId: 'group-1' },
      worktreeId: 'wt-1',
      focusedGroupId: 'group-1',
      isWorktreeActive
    })

    // DndContext has multiple children (layout wrapper + DragOverlay). The
    // layout wrapper holds [workspace-canvas-header, split-body]; the
    // split-body holds the SplitNode element.
    const layoutWrapper = element.props.children[0]
    const splitBody = layoutWrapper.props.children[1]
    const splitNodeElement = splitBody.props.children
    const tabGroupPanelElement = splitNodeElement.type(splitNodeElement.props)
    return tabGroupPanelElement.props as {
      groupId: string
      worktreeId: string
      isFocused: boolean
      hasSplitGroups: boolean
      reserveClosedExplorerToggleSpace: boolean
      reserveCollapsedSidebarHeaderSpace: boolean
    }
  }

  it('does not mark an offscreen worktree group as focused', () => {
    expect(getLeafPanelProps(false)).toEqual(
      expect.objectContaining({
        groupId: 'group-1',
        worktreeId: 'wt-1',
        isFocused: false,
        hasSplitGroups: false,
        // Why: WorkspaceCanvasHeader sits above the split tree and owns the
        // reservations for the floating sidebar / explorer toggles, so the
        // first tab strip no longer needs to set these flags.
        reserveClosedExplorerToggleSpace: false,
        reserveCollapsedSidebarHeaderSpace: false
      })
    )
  })

  it('keeps the visible worktree focused group active', () => {
    expect(getLeafPanelProps(true)).toEqual(
      expect.objectContaining({
        groupId: 'group-1',
        worktreeId: 'wt-1',
        isFocused: true,
        hasSplitGroups: false,
        reserveClosedExplorerToggleSpace: false,
        reserveCollapsedSidebarHeaderSpace: false
      })
    )
  })

  it('does not reserve top-edge toggle space — the canvas header owns that band', () => {
    const element = TabGroupSplitLayout({
      layout: {
        type: 'split',
        direction: 'horizontal',
        ratio: 0.5,
        first: { type: 'leaf', groupId: 'left-group' },
        second: { type: 'leaf', groupId: 'right-group' }
      },
      worktreeId: 'wt-1',
      focusedGroupId: 'right-group',
      isWorktreeActive: true
    })

    const layoutWrapper = element.props.children[0]
    const splitBody = layoutWrapper.props.children[1]
    const splitNodeElement = splitBody.props.children
    const rootElement = splitNodeElement.type(splitNodeElement.props)
    const leftChild = rootElement.props.children[0].props.children
    const rightChild = rootElement.props.children[2].props.children
    const leftPanelProps = leftChild.type(leftChild.props).props as {
      reserveClosedExplorerToggleSpace: boolean
      reserveCollapsedSidebarHeaderSpace: boolean
    }
    const rightPanelProps = rightChild.type(rightChild.props).props as {
      reserveClosedExplorerToggleSpace: boolean
      reserveCollapsedSidebarHeaderSpace: boolean
    }

    expect(leftPanelProps).toEqual(
      expect.objectContaining({
        reserveClosedExplorerToggleSpace: false,
        reserveCollapsedSidebarHeaderSpace: false
      })
    )
    expect(rightPanelProps).toEqual(
      expect.objectContaining({
        reserveClosedExplorerToggleSpace: false,
        reserveCollapsedSidebarHeaderSpace: false
      })
    )
  })
})
