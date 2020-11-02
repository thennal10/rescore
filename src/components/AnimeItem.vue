<template>
  <td>
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
    <span>{{ roundedScore }}</span>
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
        Score: this.score,
        backgroundImg: {
          'background-image': 'url(' + this.imgUrl + ')',
          'background-position': 'center',
          'background-size': 'cover'
        }
      }
    },
    computed: {
      roundedScore() {
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
    }
  }
</script>
<style scoped>
  .table td {
    border: none;
  }
</style>