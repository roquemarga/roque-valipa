import Form from "react-bootstrap/Form"
import Col from "react-bootstrap/Col"
import Row from "react-bootstrap/Row"
import Button from "react-bootstrap/Button"
import Modal from "react-bootstrap/Modal"

import { useCartContext } from "../context/cartContext"
import { useState } from "react"

import { getFirestore } from '../services/getFirebase'
import  firebase  from 'firebase'
import 'firebase/firestore'


const CartForm = () => {
    const [ formData, setFormData ] = useState({
        name: '',
        tel: '',
        email: ''
    })

    const [showAlert, setShowAlert] = useState(false)

    const [idVenta, setIdVenta] = useState('')

    const {cartList, totalAPagar} = useCartContext()


        
    const handleOnSubmit = (e) =>{        
        e.preventDefault()        
        
        let venta = {}

        venta.fecha = firebase.firestore.Timestamp.fromDate( new Date() );

        venta.usuario = formData
        
        venta.total = totalAPagar;
        
        venta.productos = cartList.map(cartItem => {
            const id = cartItem.producto;
            const title = cartItem.nombre;
            const precio = cartItem.precio * cartItem.cantidad;

            return {id, title, precio}   
        })
        
        
        
        const db = getFirestore()
        console.log(venta)
        db.collection('ventas').add(venta)
        .then(resp => setIdVenta(resp.id))
        .catch(err=> console.log(err))
        .finally(()=>
            setFormData({
                name: '',
                tel: '',
                email: ''
            }) 
        )            
        const actualizarProductos = db.collection('productos').where(
            firebase.firestore.FieldPath.documentId(), 'in', cartList.map(i=> i.producto)
        );
        
        const batch = db.batch();
                    
        actualizarProductos.get()
        .then( collection=>{
            collection.docs.forEach(docSnapshot => {
                batch.update(docSnapshot.ref, {
                    stock: docSnapshot.data().stock - cartList.find(producto => producto.producto === docSnapshot.id).cantidad
                })
            })

            batch.commit().then(res =>{
                console.log('resultado batch:', res)
            })

            setShowAlert(true)
        
        })
        
    }

    function handleOnChange(e) {

        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        })
        console.log(formData)

    }

const handleClose = () => setShowAlert(false);

    
return (
    <div>
        <h3 className="pt-5 text-center fst-italic text-dark">Completá el formulario para finzalizar tu compra!</h3>
            <Form onChange={handleOnChange} onSubmit={handleOnSubmit} className="container text-center py-4 w-75">
                <Row>
                    <Col>
                        <Form.Control type="text" name="name" className="fw-light m-4" placeholder="Nombre y Apellido" defaultValue={formData.name}/>
                    </Col>
                    <Col>
                        <Form.Control type="text" name='email' className="fw-light m-4" placeholder="Email" defaultValue={formData.email}/>
                    </Col>
                </Row>
                <Form.Control type="text" name="tel" className="fw-light m-4" placeholder="Teléfono o celular" defaultValue={formData.tel} />
                <Row>
                    <Col>
                        <p className="m-0 mb-0 fw-bold fst-italic">Total a pagar: ${totalAPagar}</p>
                    </Col>
                    <Col>
                        <Button variant="success" className="m-0 shadow fw-light" type="submit">Finalizar pedido</Button> 
                    </Col>
                </Row>
            </Form>

        <Modal show={showAlert} onHide={handleClose} backdrop="static">
            <Modal.Header closeButton>
                <Modal.Title className="fst-italic fw-bold">Compra realizada con exito!</Modal.Title>
            </Modal.Header>
            <Modal.Body className="fw-light">
                Te llegarán los datos del pedido al mail o teléfono para que puedas hacer el seguimiento de los productos.
                <p className="text-success fw-bolder">Id de compra: {idVenta}</p>           
            </Modal.Body>
            <Modal.Footer>
                <Button variant="warning" className="fw-light" onClick={handleClose}>Cerrar</Button>
            </Modal.Footer>
        </Modal>
</div>
)
}
export default CartForm 

