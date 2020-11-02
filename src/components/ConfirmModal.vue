<template>
    <transition name="fade">
    <div class="modal is-active" v-show="active">
            <div class="modal-background" @click="this.$emit('close')">
                <button class="modal-close is-large" aria-label="close"></button>
            </div>
        <transition name="scale-fade">
            <div class="modal-content box has-background-white" v-show="active"> <!-- v-show just to apply the animation -->
                <p class="title">Update your list?</p>
                <p>
                    This will <strong class="has-text-danger-dark">permanently</strong> overwrite the current scores on your list. 
                    Other info such as notes or start/end dates will not be affected. Are you sure you want to do this?
                </p>
                <div class="has-text-right my-3">
                    <label class="checkbox">
                        <input type="checkbox" @change="this.$emit('bypass')">
                        Don't ask me again
                    </label>
                </div>
                <button class="button is-success is-pulled-right ml-3" @click="this.$emit('confirmed'); this.$emit('close')">Yes</button>
                <button class="button is-light is-pulled-right" @click="this.$emit('close')">Cancel</button>
            </div>
        </transition>
    </div>
    </transition>
</template>
<script>
export default {
    props: {
        active: { required: true, type: Boolean }
    }
}
</script>
<style scoped>
    .fade-enter-active,
    .fade-leave-active {
        transition: opacity 0.5s ease;
    }

    .fade-enter-from,
    .fade-leave-to {
        opacity: 0;
    }

    .scale-fade-enter-active,
    .scale-fade-leave-active {
        transition: all 0.5s ease;
    }

    .scale-fade-enter-from,
    .scale-fade-leave-to {
        transform: scale(1.2);
        opacity: 0;
    }

</style>