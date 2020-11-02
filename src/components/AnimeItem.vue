<template>
  <td class='is-hidden-mobile'>
    <figure class="image is-48x48" :style="backgroundImg">
    </figure>
  </td>
  <td>
    <span>{{ name }}</span>
  </td>
  <td class="has-text-centered">
    <span>{{ ogScore }}</span>
  </td>
  <td class="has-text-centered" :class="scoreClass">
    <input
      type="number" min="1" max="100" size="1"
      class="input"
      v-if="this.edit"
      :value="score"
      @blur="this.edit = false; $emit('update:score', Number($event.target.value))"
      @keyup.enter="this.edit = false; $emit('update:score', Number($event.target.value))"
      v-focus
    >
    <div v-else>
        <label @click="this.edit = true;"> {{roundedScore}} </label>
    </div>
  </td>
</template>
<script>
  export default {
    props: {
      id: { required: true, type: Number },
      name: { required: true, type: String },
      imgUrl: { required: true, type: String },
      score: { type: Number },
      ogScore: { type: Number }
    },
    data() {
      return {
        backgroundImg: {
          'background-image': 'url(' + this.imgUrl + ')',
          'background-position': 'center',
          'background-size': 'cover'
        },
        edit: false
      }
    },
    computed: {
      roundedScore() {
        console.log(typeof this.score)
        if (typeof this.score != "number") {
          this.$emit('update:score', this.ogScore)
        } 
        return this.score > 100 ? 100 : this.score < 1 ? 1 : Math.round(this.score);
      },
      scoreClass() {
        if (this.roundedScore > this.ogScore) {
          return "has-text-success-dark"
        } 
        else if (this.roundedScore < this.ogScore) {
          return "has-text-danger-dark" 
        } 
        else { 
          return "has-text-grey-light"
        }
      }
    },
    directives: {
      focus: {
        mounted(el) {
          el.focus()
        }
      }
    }
  }
</script>
<style scoped>
  .table td {
    border: none;
  }
</style>