import type {Fragment, Node as ProseMirrorNode, Slice} from '@tiptap/pm/model'

// Plain-text representation of a copied editor selection. ProseMirror's default
// serializer only joins text content, which throws away list markers. Copying a
// bullet list should give the same "- item" lines the user sees in the editor.

const BULLET_LIST_TYPES = ['bulletList', 'taskList']
const ORDERED_LIST_TYPES = ['orderedList']

export function sliceToPlainText(slice: Slice): string {
	return blocksToText(slice.content, '\n\n', '')
}

// Every returned line is prefixed with `indent`, so nested blocks line up.
function blocksToText(fragment: Fragment, separator: string, indent: string): string {
	const blocks: string[] = []
	fragment.forEach(node => blocks.push(blockToText(node, indent)))
	return blocks.join(separator)
}

function blockToText(node: ProseMirrorNode, indent: string): string {
	if (isList(node)) {
		return listToText(node, indent)
	}
	if (node.isTextblock || node.isLeaf || node.childCount === 0) {
		return indent + node.textContent
	}
	return blocksToText(node.content, '\n\n', indent)
}

function listToText(list: ProseMirrorNode, indent: string): string {
	const ordered = ORDERED_LIST_TYPES.includes(list.type.name)
	const lines: string[] = []
	let index = 1

	list.forEach(item => {
		const marker = ordered ? `${index++}. ` : '- '
		const itemIndent = ' '.repeat(marker.length)
		// The first line of the item gets the marker, following lines are indented under it.
		const body = blocksToText(item.content, '\n', indent + itemIndent)
		lines.push(indent + marker + body.slice(indent.length + itemIndent.length))
	})

	return lines.join('\n')
}

function isList(node: ProseMirrorNode): boolean {
	return BULLET_LIST_TYPES.includes(node.type.name) || ORDERED_LIST_TYPES.includes(node.type.name)
}
