import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

export default function SortableTile({ link, index, getColor, getMonogram, onRequestDelete }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: link.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
    animationDelay: (index % 2 === 0 ? '0s' : '0.08s'),
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={'tile tile-edit' + (isDragging ? ' dragging' : '')}
      {...attributes}
      {...listeners}
    >
      <button
        type="button"
        className="del-btn-sm"
        title="刪除"
        onPointerDown={e => e.stopPropagation()}
        onClick={e => {
          e.stopPropagation()
          onRequestDelete({ id: link.id, name: link.name })
        }}
      >
        &minus;
      </button>
      <div className="badge" style={{ background: getColor(link.name) }}>
        {getMonogram(link.name)}
      </div>
      <div className="tile-name">{link.name}</div>
    </div>
  )
}
