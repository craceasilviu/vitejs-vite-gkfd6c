import toast from 'svelte-french-toast';

export const showSuccess = (message) => {
  toast.success(message, {
    position: 'top-right',
    duration: 3000,
    style: 'border-radius: 10px; background: #059669; color: white;'
  });
};

export const showError = (message) => {
  toast.error(message, {
    position: 'top-right',
    duration: 5000,
    style: 'border-radius: 10px; background: #DC2626; color: white;'
  });
};

export const showInfo = (message) => {
  toast.info(message, {
    position: 'top-right',
    duration: 3000,
    style: 'border-radius: 10px; background: #3B82F6; color: white;'
  });
};

export const showConfirm = (message) => {
  return new Promise((resolve) => {
    const toastId = toast.custom(
      `<div class="flex items-center gap-4">
        <p class="text-sm">${message}</p>
        <div class="flex gap-2">
          <button
            class="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700"
            onclick="document.dispatchEvent(new CustomEvent('toast-confirm', { detail: true }))"
          >
            Yes
          </button>
          <button
            class="px-3 py-1 text-sm bg-gray-600 text-white rounded hover:bg-gray-700"
            onclick="document.dispatchEvent(new CustomEvent('toast-confirm', { detail: false }))"
          >
            No
          </button>
        </div>
      </div>`,
      {
        duration: Infinity,
        position: 'top-center',
        style: 'border-radius: 10px; background: white; color: black; padding: 1rem;'
      }
    );

    const handleConfirm = (e) => {
      toast.dismiss(toastId);
      resolve(e.detail);
      document.removeEventListener('toast-confirm', handleConfirm);
    };

    document.addEventListener('toast-confirm', handleConfirm);
  });
};