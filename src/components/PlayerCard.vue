<template>
    <div class="col player">
      <h3>{{ name }}</h3>
    </div>
</template>

<script>
export default {
  name: 'Board',
  props: ['name'],
  data: () => (
    {
      inputs: [
        { name: 'Ava' },
        { name: 'Mya' },
        { name: 'Addison' },
        { name: 'Mom' },
        { name: 'Dad' },
      ],
    }
  ),
};
</script>
