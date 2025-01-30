import type { Active, UniqueIdentifier } from '@dnd-kit/core';
import { DndContext, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { restrictToParentElement } from '@dnd-kit/modifiers';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import clsx from 'clsx';
import type { ReactNode } from 'react';
import React, { useEffect, useMemo, useState } from 'react';

import { SortableItemOverlay } from './SortableItemOverlay';
import { SortableListItem } from './SortableListItem';

/**
 * Extendable Prop for Sortable Item Id
 */
export interface BaseItem {
    id: UniqueIdentifier;
}

/**
 * Props for the List component.
 */
export interface ListProps<T extends BaseItem> {
    draggables: T[];
    /**
     *
     * @param items - Handles the behavior of the list when items change order
     */
    onChange(items: T[]): void;
    /**
     *
     * @param item - Renders a sortable item component
     */
    renderItem(item: T): ReactNode;
    className?: string; // Impacts the spacing between items in the list
}

/**
 * SortableList is a component that renders a drag-and-drop sortable list restricted by its parent
 */
export function SortableList<T extends BaseItem>({
    draggables,
    renderItem,
    onChange,
    className,
}: ListProps<T>): JSX.Element {
    const [active, setActive] = useState<Active | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [items, setItems] = useState<T[]>(draggables);

    useEffect(() => {
        setItems(draggables);
    }, [draggables]);

    const activeItem = useMemo(() => items.find(item => item.id === active?.id), [active, items]);

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    return (
        <div
            className={clsx('h-full w-full', {
                'cursor-grabbing [&_*]:cursor-grabbing': isDragging,
                'cursor-default': !isDragging,
            })}
        >
            <ul className={clsx('overflow-clip flex gap-spacing-3 flex-col', className)}>
                <DndContext
                    modifiers={[restrictToParentElement]}
                    sensors={sensors}
                    onDragStart={({ active }) => {
                        setIsDragging(true);
                        setActive(active);
                    }}
                    onDragEnd={({ active, over }) => {
                        setIsDragging(false);
                        if (over && active.id !== over.id) {
                            const activeIndex = items.findIndex(({ id }) => id === active.id);
                            const overIndex = items.findIndex(({ id }) => id === over.id);
                            const reorderedItems = arrayMove(items, activeIndex, overIndex);
                            onChange(reorderedItems);
                            setItems(reorderedItems);
                        }
                        setActive(null);
                    }}
                    onDragCancel={() => {
                        setIsDragging(false);
                        setActive(null);
                    }}
                >
                    <SortableContext items={items} strategy={verticalListSortingStrategy}>
                        {items.map(item => (
                            <SortableListItem key={item.id} id={item.id}>
                                {renderItem(item)}
                            </SortableListItem>
                        ))}
                    </SortableContext>
                    <SortableItemOverlay>
                        {activeItem ? (
                            <SortableListItem id={activeItem.id}>{renderItem(activeItem)}</SortableListItem>
                        ) : null}
                    </SortableItemOverlay>
                </DndContext>
            </ul>
        </div>
    );
}
