<script>
  import { currentUser } from '../stores/users';
  import { products } from '../stores/products';
  import { authorizations } from '../stores/authorizations';
  import { updateUserProfile } from '../services/users';
  import { format } from 'date-fns';
  import { showError } from '../lib/toast';

  let editMode = false;
  let loading = false;
  let formData = {
    companyName: '',
    vatNumber: '',
    address: {
      street: '',
      city: '',
      state: '',
      country: '',
      postalCode: '',
      lat: null,
      lng: null
    },
    certifications: {
      globalGap: {
        number: '',
        validUntil: '',
        status: 'valid'
      },
      grasp: {
        number: '',
        validUntil: '',
        status: 'valid'
      },
      eco: {
        number: '',
        validUntil: '',
        status: 'valid'
      }
    }
  };

  $: {
    if ($currentUser && !editMode) {
      formData = {
        companyName: $currentUser.companyName || '',
        vatNumber: $currentUser.vatNumber || '',
        address: {
          street: $currentUser.address?.street || '',
          city: $currentUser.address?.city || '',
          state: $currentUser.address?.state || '',
          country: $currentUser.address?.country || '',
          postalCode: $currentUser.address?.postalCode || '',
          lat: $currentUser.address?.lat || null,
          lng: $currentUser.address?.lng || null
        },
        certifications: {
          globalGap: {
            number: $currentUser.certifications?.globalGap?.number || '',
            validUntil: $currentUser.certifications?.globalGap?.validUntil || '',
            status: $currentUser.certifications?.globalGap?.status || 'valid'
          },
          grasp: {
            number: $currentUser.certifications?.grasp?.number || '',
            validUntil: $currentUser.certifications?.grasp?.validUntil || '',
            status: $currentUser.certifications?.grasp?.status || 'valid'
          },
          eco: {
            number: $currentUser.certifications?.eco?.number || '',
            validUntil: $currentUser.certifications?.eco?.validUntil || '',
            status: $currentUser.certifications?.eco?.status || 'valid'
          }
        }
      };
    }
  }

  $: authorizedProductsList = $products.filter(product => 
    $authorizations.some(auth => 
      auth.userId === $currentUser?.id && 
      auth.productId === product.id
    )
  );

  async function handleSubmit(event) {
    event.preventDefault();
    if (!$currentUser?.id || loading) return;

    loading = true;
    try {
      // Convert coordinates to numbers
      const lat = formData.address.lat ? Number(formData.address.lat) : null;
      const lng = formData.address.lng ? Number(formData.address.lng) : null;

      const success = await updateUserProfile($currentUser.id, {
        companyName: formData.companyName,
        vatNumber: formData.vatNumber,
        address: {
          ...formData.address,
          lat,
          lng
        },
        certifications: formData.certifications
      });

      if (success) {
        editMode = false;
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      showError(error.message || 'Failed to update profile');
    } finally {
      loading = false;
    }
  }

  function formatDate(date) {
    if (!date) return 'Not set';
    return format(new Date(date), 'MMM d, yyyy');
  }
</script>

<!-- Rest of the Profile.svelte template code remains exactly the same -->