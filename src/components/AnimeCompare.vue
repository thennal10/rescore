<template>
    <div class="column" @click="this.$emit('comparison-clicked', this.id)">
        <figure class="image is-4by5">
            <img :src="largeImgUrl">
        </figure>
        <p class="is-size-3">{{ name }}</p>
    </div>
</template>
<script>
export default {
    props: {
        id: {type: Number},
        name: {required: true, type: String},
        largeImgUrl: {required: true, type: String},
        score: {required: true, type: Number}
    }
}
</script>
<style scoped>
    img {
        object-fit: cover;
    }
</style>