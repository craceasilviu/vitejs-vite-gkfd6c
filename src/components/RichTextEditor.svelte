<script>
  import { onMount, onDestroy } from 'svelte';
  import { Editor } from '@tiptap/core';
  import StarterKit from '@tiptap/starter-kit';
  import Highlight from '@tiptap/extension-highlight';
  import TextAlign from '@tiptap/extension-text-align';
  import Link from '@tiptap/extension-link';
  import Underline from '@tiptap/extension-underline';

  export let content = '';
  export let onChange = () => {};

  let element;
  let editor;

  const buttons = [
    { icon: 'format_bold', command: () => editor.chain().focus().toggleBold().run(), isActive: () => editor?.isActive('bold') },
    { icon: 'format_italic', command: () => editor.chain().focus().toggleItalic().run(), isActive: () => editor?.isActive('italic') },
    { icon: 'format_underline', command: () => editor.chain().focus().toggleUnderline().run(), isActive: () => editor?.isActive('underline') },
    { icon: 'highlight', command: () => editor.chain().focus().toggleHighlight().run(), isActive: () => editor?.isActive('highlight') },
    { type: 'divider' },
    { icon: 'format_h1', command: () => editor.chain().focus().toggleHeading({ level: 1 }).run(), isActive: () => editor?.isActive('heading', { level: 1 }) },
    { icon: 'format_h2', command: () => editor.chain().focus().toggleHeading({ level: 2 }).run(), isActive: () => editor?.isActive('heading', { level: 2 }) },
    { type: 'divider' },
    { icon: 'format_align_left', command: () => editor.chain().focus().setTextAlign('left').run(), isActive: () => editor?.isActive({ textAlign: 'left' }) },
    { icon: 'format_align_center', command: () => editor.chain().focus().setTextAlign('center').run(), isActive: () => editor?.isActive({ textAlign: 'center' }) },
    { icon: 'format_align_right', command: () => editor.chain().focus().setTextAlign('right').run(), isActive: () => editor?.isActive({ textAlign: 'right' }) },
    { type: 'divider' },
    { icon: 'format_list_bulleted', command: () => editor.chain().focus().toggleBulletList().run(), isActive: () => editor?.isActive('bulletList') },
    { icon: 'format_list_numbered', command: () => editor.chain().focus().toggleOrderedList().run(), isActive: () => editor?.isActive('orderedList') },
  ];

  onMount(() => {
    editor = new Editor({
      element,
      extensions: [
        StarterKit,
        Highlight,
        TextAlign.configure({
          types: ['heading', 'paragraph'],
        }),
        Link.configure({
          openOnClick: false,
        }),
        Underline,
      ],
      content,
      onUpdate: ({ editor }) => {
        content = editor.getHTML();
        onChange(content);
      },
    });

    // Load Google Material Icons
    const link = document.createElement('link');
    link.href = 'https://fonts.googleapis.com/icon?family=Material+Icons';
    link.rel = 'stylesheet';
    document.head.appendChild(link);
  });

  onDestroy(() => {
    if (editor) {
      editor.destroy();
    }
  });

  export function setContent(newContent) {
    if (editor) {
      editor.commands.setContent(newContent);
    }
  }

  function addLink() {
    const url = window.prompt('URL');
    if (url) {
      editor.chain().focus().setLink({ href: url }).run();
    }
  }

  function removeLink() {
    editor.chain().focus().unsetLink().run();
  }
</script>

<div class="rich-text-editor border rounded-lg overflow-hidden">
  <!-- Toolbar -->
  <div class="flex flex-wrap gap-1 p-2 bg-gray-50 border-b">
    {#each buttons as button}
      {#if button.type === 'divider'}
        <div class="w-px h-8 bg-gray-300 mx-1"></div>
      {:else}
        <button
          class="p-2 rounded hover:bg-gray-200 transition-colors {button.isActive() ? 'bg-gray-200 text-green-600' : 'text-gray-700'}"
          on:click={button.command}
          title={button.icon.replace(/_/g, ' ').toLowerCase()}
        >
          <span class="material-icons text-xl">{button.icon}</span>
        </button>
      {/if}
    {/each}
    
    <!-- Link buttons -->
    <div class="w-px h-8 bg-gray-300 mx-1"></div>
    <button
      class="p-2 rounded hover:bg-gray-200 transition-colors {editor?.isActive('link') ? 'bg-gray-200 text-green-600' : 'text-gray-700'}"
      on:click={addLink}
      title="add link"
    >
      <span class="material-icons text-xl">link</span>
    </button>
    {#if editor?.isActive('link')}
      <button
        class="p-2 rounded hover:bg-gray-200 transition-colors text-gray-700"
        on:click={removeLink}
        title="remove link"
      >
        <span class="material-icons text-xl">link_off</span>
      </button>
    {/if}
  </div>

  <!-- Editor -->
  <div 
    bind:this={element} 
    class="prose max-w-none p-4 min-h-[200px] focus:outline-none"
  ></div>
</div>

<style>
  :global(.ProseMirror) {
    outline: none;
  }

  :global(.ProseMirror p) {
    margin: 0.5em 0;
  }

  :global(.ProseMirror h1) {
    font-size: 1.5em;
    font-weight: bold;
    margin: 1em 0 0.5em;
  }

  :global(.ProseMirror h2) {
    font-size: 1.25em;
    font-weight: bold;
    margin: 1em 0 0.5em;
  }

  :global(.ProseMirror ul) {
    list-style-type: disc;
    padding-left: 1.5em;
    margin: 0.5em 0;
  }

  :global(.ProseMirror ol) {
    list-style-type: decimal;
    padding-left: 1.5em;
    margin: 0.5em 0;
  }

  :global(.ProseMirror a) {
    color: #059669;
    text-decoration: underline;
  }

  :global(.ProseMirror mark) {
    background-color: #fef08a;
  }
</style>