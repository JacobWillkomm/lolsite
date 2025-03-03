import {useState, useCallback} from 'react'
import {Popover} from 'react-tiny-popover'

export function Item(props: any) {
  return (
    <div>
      {props.item === null && <span>Retrieving item...</span>}
      {props.item !== null && (
        <div>
          <div>
            <span style={{textDecoration: 'underline'}}>{props.item.name}</span>{' '}
            <span style={{color: 'gold'}}>{props.item.gold.total}</span>
          </div>
          <div>
            <small dangerouslySetInnerHTML={{__html: props.item.description}}></small>
          </div>
        </div>
      )}
    </div>
  )
}

export function ItemPopover(props: any) {
  const [isOpen, setIsOpen] = useState(false)
  const [isAttemptedGet, setIsAttemptedGet] = useState(false)
  const {item_id, major, minor, store, item, getItem} = props

  const toggle = useCallback(() => {
    setIsOpen((state) => !state)
    if (item === null && !isAttemptedGet) {
      if (item_id) {
        getItem(item_id, major, minor, store)
        setIsAttemptedGet(true)
      }
    }
  }, [isAttemptedGet, item, item_id, major, minor, store, getItem])

  if (props.item_id) {
    return (
      <Popover
        onClickOutside={() => setIsOpen(false)}
        isOpen={isOpen}
        positions={['top']}
        containerStyle={{zIndex: '11'}}
        content={<Item item={props.item} />}
      >
        <div style={{...props.style, cursor: 'pointer'}} onClick={toggle}>
          {props.children}
        </div>
      </Popover>
    )
  } else {
    return <div style={props.style}>{props.children}</div>
  }
}
