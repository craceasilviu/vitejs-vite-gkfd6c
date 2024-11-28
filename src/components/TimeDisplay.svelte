<script>
  import { onMount, onDestroy } from 'svelte';
  import { format } from 'date-fns';
  import { ro } from 'date-fns/locale';

  let currentTime = new Date();
  let timer;

  onMount(() => {
    // Update time every second
    timer = setInterval(() => {
      currentTime = new Date();
    }, 1000);
  });

  onDestroy(() => {
    if (timer) clearInterval(timer);
  });
</script>

<div class="text-sm text-gray-600">
  <time datetime={currentTime.toISOString()}>
    {format(currentTime, 'EEEE, d MMMM yyyy HH:mm:ss', { locale: ro })}
  </time>
  <span class="ml-1 text-gray-500">
    (GMT+2)
  </span>
</div>