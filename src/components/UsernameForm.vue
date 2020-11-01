<template>
<div>
  <label for="username-input" class="label">
    Enter your username here.
  </label>
  <form @submit.prevent="onSubmit" class="field has-addons has-addons-centered">
    <div class="control">
      <input
        type="text"
        class="input"
        id="username-input"
        name="username-input"
        autocomplete="on"
        v-model.lazy.trim="username"
      />
    </div>
    <div class="control">
      <button class="button is-info">
        Search
      </button>
    </div>
  </form>
</div>
</template>

<script>
  export default {
      methods: {
          onSubmit() {
              this.$emit("find-user", this.username);
          }
      },
      data() {
        return {
            username: ""
        }
      }
  };
</script>