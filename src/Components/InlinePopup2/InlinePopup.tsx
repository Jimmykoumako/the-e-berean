import React, { useState, useRef, useEffect } from 'react';
import {
    ExternalLink,
    Book,
    Bookmark,
    Share2,
    Copy,
    Edit,
    MoreHorizontal,
    X,
    MessageSquare,
    History,
    Search,
    BookOpen,
    Link2,
    Tags
} from 'lucide-react';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

// Enhanced types
type ContentType = 'verse' | 'note' | 'text' | 'crossReference';

interface ContentReference {
    id: string;
    type: ContentType;
    content: string;
    reference?: string; // For verses (e.g., "John 3:16")
    title?: string; // For notes
    tags?: string[]; // For categorization
    lastModified?: string; // For tracking changes
    crossReferences?: string[]; // For related verses
    annotations?: string[]; // For additional notes
}

interface Action {
    label: string;
    icon: React.ElementType;
    onClick: () => void;
    tooltip?: string;
    primary?: boolean;
}

interface InlinePopupProps {
    contentRef: ContentReference;
    triggerText?: string;
    onViewInContext?: (ref: ContentReference) => void;
    onBookmark?: (ref: ContentReference) => void;
    onShare?: (ref: ContentReference) => void;
    onEdit?: (ref: ContentReference) => void;
    onAddNote?: (ref: ContentReference) => void;
    onViewHistory?: (ref: ContentReference) => void;
    onSearch?: (ref: ContentReference) => void;
    onCompare?: (ref: ContentReference) => void;
    onCrossReference?: (ref: ContentReference) => void;
    onTagsEdit?: (ref: ContentReference) => void;
    className?: string;
    size?: 'sm' | 'md' | 'lg';
    theme?: 'light' | 'dark';
}

const InlinePopup = ({
                         contentRef,
                         triggerText,
                         onViewInContext,
                         onBookmark,
                         onShare,
                         onEdit,
                         onAddNote,
                         onViewHistory,
                         onSearch,
                         onCompare,
                         onCrossReference,
                         onTagsEdit,
                         className = '',
                         size = 'md',
                         theme = 'light'
                     }: InlinePopupProps) => {
    const [isOpen, setIsOpen] = useState(false);
    const [copied, setCopied] = useState(false);

    // Size configurations
    const sizeConfig = {
        sm: {
            width: 'w-64',
            maxHeight: 'max-h-32',
            iconSize: 'h-3 w-3',
            fontSize: 'text-xs'
        },
        md: {
            width: 'w-80',
            maxHeight: 'max-h-48',
            iconSize: 'h-4 w-4',
            fontSize: 'text-sm'
        },
        lg: {
            width: 'w-96',
            maxHeight: 'max-h-64',
            iconSize: 'h-5 w-5',
            fontSize: 'text-base'
        }
    };

    // Theme configurations
    const themeConfig = {
        light: {
            bg: 'bg-white',
            border: 'border-gray-200',
            text: 'text-gray-900',
            hover: 'hover:bg-gray-100'
        },
        dark: {
            bg: 'bg-gray-800',
            border: 'border-gray-700',
            text: 'text-gray-100',
            hover: 'hover:bg-gray-700'
        }
    };

    useEffect(() => {
        if (copied) {
            const timer = setTimeout(() => setCopied(false), 2000);
            return () => clearTimeout(timer);
        }
    }, [copied]);

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(contentRef.content);
            setCopied(true);
        } catch (err) {
            console.error('Failed to copy text:', err);
        }
    };

    // Get content-specific actions
    const getContentTypeConfig = () => {
        const baseActions = [
            {
                label: 'Copy',
                icon: Copy,
                onClick: handleCopy,
                tooltip: copied ? 'Copied!' : 'Copy to clipboard'
            },
            {
                label: 'Share',
                icon: Share2,
                onClick: () => onShare?.(contentRef),
                tooltip: 'Share this content'
            }
        ];

        switch (contentRef.type) {
            case 'verse':
                return {
                    icon: Book,
                    actions: [
                        {
                            label: 'View in Chapter',
                            icon: ExternalLink,
                            onClick: () => onViewInContext?.(contentRef),
                            tooltip: 'Open in Bible reader',
                            primary: true
                        },
                        {
                            label: 'Bookmark',
                            icon: Bookmark,
                            onClick: () => onBookmark?.(contentRef),
                            tooltip: 'Save for later'
                        },
                        {
                            label: 'Add Note',
                            icon: MessageSquare,
                            onClick: () => onAddNote?.(contentRef),
                            tooltip: 'Add annotation'
                        },
                        {
                            label: 'Compare',
                            icon: BookOpen,
                            onClick: () => onCompare?.(contentRef),
                            tooltip: 'Compare translations'
                        },
                        {
                            label: 'Cross References',
                            icon: Link2,
                            onClick: () => onCrossReference?.(contentRef),
                            tooltip: 'View related verses'
                        },
                        ...baseActions
                    ]
                };

            case 'note':
                return {
                    icon: Edit,
                    actions: [
                        {
                            label: 'Edit',
                            icon: Edit,
                            onClick: () => onEdit?.(contentRef),
                            tooltip: 'Edit note',
                            primary: true
                        },
                        {
                            label: 'History',
                            icon: History,
                            onClick: () => onViewHistory?.(contentRef),
                            tooltip: 'View edit history'
                        },
                        {
                            label: 'Tags',
                            icon: Tags,
                            onClick: () => onTagsEdit?.(contentRef),
                            tooltip: 'Manage tags'
                        },
                        ...baseActions
                    ]
                };

            default:
                return {
                    icon: MoreHorizontal,
                    actions: baseActions
                };
        }
    };

    const { icon: TypeIcon, actions } = getContentTypeConfig();
    const { width, maxHeight, iconSize, fontSize } = sizeConfig[size];
    const { bg, border, text, hover } = themeConfig[theme];

    return (
        <TooltipProvider>
            <Popover open={isOpen} onOpenChange={setIsOpen}>
                <PopoverTrigger asChild>
                    <button
                        className={cn(
                            'inline-flex items-center px-1 rounded hover:bg-gray-100 text-blue-600',
                            className
                        )}
                    >
                        {triggerText || contentRef.content}
                    </button>
                </PopoverTrigger>

                <PopoverContent
                    className={cn('p-0', width, bg, border)}
                    align="start"
                >
                    {/* Header */}
                    <div className={cn('flex items-center justify-between p-3 border-b', border)}>
                        <div className="flex items-center space-x-2">
                            <TypeIcon className={iconSize} />
                            <span className={cn('font-medium', fontSize)}>
                {contentRef.type === 'verse' ? contentRef.reference :
                    contentRef.type === 'note' ? contentRef.title :
                        'Text'}
              </span>
                        </div>
                        <button
                            onClick={() => setIsOpen(false)}
                            className="text-gray-500 hover:text-gray-700"
                        >
                            <X className={iconSize} />
                        </button>
                    </div>

                    {/* Content */}
                    <div className={cn('p-3', maxHeight, 'overflow-y-auto')}>
                        <p className={cn(fontSize, text, 'whitespace-pre-wrap')}>
                            {contentRef.content}
                        </p>

                        {/* Tags */}
                        {contentRef.tags && contentRef.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-2">
                                {contentRef.tags.map((tag, index) => (
                                    <span
                                        key={index}
                                        className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full text-xs"
                                    >
                    {tag}
                  </span>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Actions */}
                    <div className={cn('flex items-center justify-between p-2 border-t', border, 'bg-gray-50')}>
                        <div className="flex items-center space-x-1 flex-wrap gap-1">
                            {actions.map((action, index) => (
                                <Tooltip key={index}>
                                    <TooltipTrigger asChild>
                                        <button
                                            onClick={action.onClick}
                                            className={cn(
                                                'p-1.5 rounded',
                                                action.primary
                                                    ? 'bg-blue-100 text-blue-600 hover:bg-blue-200'
                                                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200'
                                            )}
                                        >
                                            <action.icon className={iconSize} />
                                        </button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <p>{action.tooltip || action.label}</p>
                                    </TooltipContent>
                                </Tooltip>
                            ))}
                        </div>
                    </div>
                </PopoverContent>
            </Popover>
        </TooltipProvider>
    );
};

export default InlinePopup;