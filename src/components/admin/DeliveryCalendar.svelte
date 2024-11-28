<script>
  import { format, addDays, startOfWeek, getWeek } from 'date-fns';
  import { offers } from '../../stores/offers';

  const { selectedDate, currentMonth, onDateSelect, onMonthChange } = $props();

  let calendarDates = $derived(() => {
    const dates = [];
    const start = startOfWeek(new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1));
    const end = startOfWeek(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0));
    
    let current = start;
    while (current <= end) {
      for (let i = 0; i < 7; i++) {
        const date = addDays(current, i);
        const dayName = format(date, 'EEEE');
        const weekNumber = getWeek(date);
        
        const hasDeliveries = $offers.some(o => 
          o.status === 'approved' &&
          o.weekNumber === weekNumber &&
          o.deliveryAllocations?.[dayName]?.some(p => 
            p.allocations?.some(a => a.quantity > 0)
          )
        );

        dates.push({
          date,
          hasDeliveries,
          isCurrentMonth: date.getMonth() === currentMonth.getMonth(),
          isSelected: format(date, 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd'),
          weekNumber
        });
      }
      current = addDays(current, 7);
    }
    return dates;
  });

  function previousMonth() {
    const newMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1);
    onMonthChange(newMonth);
  }

  function nextMonth() {
    const newMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1);
    onMonthChange(newMonth);
  }
</script>

<div class="bg-white p-6 rounded-lg shadow-md">
  <div class="flex items-center justify-between mb-4">
    <h2 class="text-xl font-semibold text-gray-800">
      {format(currentMonth, 'MMMM yyyy')}
    </h2>
    <div class="flex gap-2">
      <button
        type="button"
        onclick={previousMonth}
        class="p-2 rounded-lg hover:bg-gray-100"
      >
        ←
      </button>
      <button
        type="button"
        onclick={() => onDateSelect(new Date())}
        class="px-3 py-1 rounded-lg hover:bg-gray-100 text-sm"
      >
        Today
      </button>
      <button
        type="button"
        onclick={nextMonth}
        class="p-2 rounded-lg hover:bg-gray-100"
      >
        →
      </button>
    </div>
  </div>

  <div class="grid grid-cols-7 gap-2">
    {#each ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as day}
      <div class="text-center text-sm font-medium text-gray-500 py-2">
        {day}
      </div>
    {/each}

    {#each calendarDates as { date, hasDeliveries, isCurrentMonth, isSelected, weekNumber }}
      <button
        type="button"
        onclick={() => onDateSelect(date)}
        class="
          p-3 rounded-lg text-center relative
          {isSelected ? 'bg-green-500 text-white' : 
           hasDeliveries ? 'bg-green-50 text-gray-900' : 'text-gray-500'}
          {!isCurrentMonth ? 'opacity-50' : ''}
          hover:bg-green-100 transition-colors
        "
      >
        <span class="block text-sm">
          {format(date, 'd')}
        </span>
        <span class="text-xs text-gray-500">
          Week {weekNumber}
        </span>
        {#if hasDeliveries}
          <span class="block mt-1 w-2 h-2 bg-green-500 rounded-full mx-auto"></span>
        {/if}
      </button>
    {/each}
  </div>
</div>