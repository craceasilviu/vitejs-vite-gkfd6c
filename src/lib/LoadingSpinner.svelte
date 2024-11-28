<script>
  import { Circle3 } from 'svelte-loading-spinners';
  
  export let size = 60;
  export let color = '#059669';
  export let unit = 'px';
  export let duration = '1s';
</script>

<div class="flex items-center justify-center p-4">
  <Circle3 {size} {color} {unit} {duration} />
</div>